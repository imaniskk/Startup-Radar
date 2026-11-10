"""Job openings, applications, and private application documents."""
import logging
from datetime import datetime, timezone
from typing import Literal
from urllib.parse import urlsplit
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from httpx import HTTPError
from postgrest.exceptions import APIError
from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator
from storage3.exceptions import StorageApiError

from database import supabase

logger = logging.getLogger(__name__)
DOCUMENT_BUCKET = "application-documents"
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
DOCUMENT_TYPES = ("resume", "transcript")


class ApplicationQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: UUID
    label: str = Field(min_length=1, max_length=200)
    type: Literal["short_text", "long_text", "url", "yes_no"]
    required: bool = False

    @field_validator("label", mode="before")
    @classmethod
    def trim_label(cls, value):
        return value.strip() if isinstance(value, str) else value


class OpeningInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    company_name: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=10000)
    questions: list[ApplicationQuestion] = Field(default_factory=list, max_length=30)

    @field_validator("company_name", "title", "description", mode="before")
    @classmethod
    def trim_fields(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def unique_question_ids(self):
        ids = [question.id for question in self.questions]
        if len(ids) != len(set(ids)):
            raise ValueError("Application question IDs must be unique.")
        return self


class OpeningStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["open", "closed"]


class ApplicationDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")
    answers: dict[str, object]


class ApplicationDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["pending", "accepted", "rejected"]


def execute(query, message="Unable to load or save job application data. Please try again."):
    try:
        return query.execute().data
    except (APIError, HTTPError):
        raise HTTPException(503, message) from None


def require_role(account, role):
    client, user = account
    rows = execute(
        client.table("user").select("account_type").eq("user_id", str(user.id)),
        "Unable to verify your account. Please try again.",
    )
    if not rows or rows[0]["account_type"] != role:
        raise HTTPException(403, f"This action requires an {role} account.")
    return client, user


def get_applicant_application(client, application_id, applicant_id):
    rows = execute(
        client.table("job_application").select(
            "*,opening:job_opening(opening_id,title,company_name,description,status,questions,founder_id)"
        ).eq("application_id", str(application_id)).eq("applicant_id", str(applicant_id)),
        "Unable to load this application. Please try again.",
    )
    if not rows:
        raise HTTPException(404, "Application not found.")
    return rows[0]


def get_founder_opening(client, opening_id, founder_id):
    rows = execute(
        client.table("job_opening").select("*").eq("opening_id", str(opening_id)).eq("founder_id", str(founder_id)),
        "Unable to load this job opening. Please try again.",
    )
    if not rows:
        raise HTTPException(404, "Job opening not found.")
    return rows[0]


def get_accessible_application(client, application_id):
    rows = execute(
        client.table("job_application").select(
            "*,opening:job_opening(opening_id,title,company_name,founder_id,status,questions)"
        ).eq("application_id", str(application_id)),
        "Unable to load this application. Please try again.",
    )
    if not rows:
        raise HTTPException(404, "Application not found.")
    return rows[0]


def validate_answers(questions, answers, *, require_required):
    question_ids = {str(question["id"]) for question in questions}
    if answers.keys() - question_ids:
        raise HTTPException(422, "Answers contain a field that is not on this application.")

    for question in questions:
        key = str(question["id"])
        value = answers.get(key)
        if question["type"] == "yes_no":
            valid = isinstance(value, bool)
        else:
            valid = isinstance(value, str)
            if valid and question["type"] == "url" and value.strip():
                try:
                    parsed_url = urlsplit(value.strip())
                    valid = (
                        parsed_url.scheme in ("https", "http")
                        and bool(parsed_url.hostname)
                        and parsed_url.username is None
                        and parsed_url.password is None
                        and len(value) <= 2000
                    )
                except ValueError:
                    valid = False
            if valid and question["type"] == "short_text":
                valid = len(value) <= 1000
            if valid and question["type"] == "long_text":
                valid = len(value) <= 10000
        if value is not None and not valid:
            raise HTTPException(422, f"Invalid answer for {question['label']}.")
        if require_required and question["required"]:
            if value is None or (isinstance(value, str) and not value.strip()):
                raise HTTPException(422, f"{question['label']} is required.")


def document_path(application_id, document_type):
    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(404, "Document type not found.")
    return f"{application_id}/{document_type}.pdf"


def register_job_routes(app: FastAPI, authenticated_account):
    @app.get("/openings")
    def open_openings():
        return execute(
            supabase.table("job_opening").select(
                "opening_id,company_name,title,description,questions,created_at"
            ).eq("status", "open").order("created_at", desc=True),
            "Unable to load open jobs. Please try again.",
        )

    @app.get("/openings/{opening_id}")
    def open_opening(opening_id: UUID):
        rows = execute(
            supabase.table("job_opening").select(
                "opening_id,company_name,title,description,questions,created_at"
            ).eq("opening_id", str(opening_id)).eq("status", "open"),
            "Unable to load this job. Please try again.",
        )
        if not rows:
            raise HTTPException(404, "This job is no longer open.")
        return rows[0]

    @app.get("/founder/openings")
    def founder_openings(account=Depends(authenticated_account)):
        client, user = require_role(account, "founder")
        return execute(
            client.table("job_opening").select("*").eq("founder_id", str(user.id)).order("created_at", desc=True)
        )

    @app.post("/founder/openings", status_code=201)
    def create_opening(body: OpeningInput, account=Depends(authenticated_account)):
        client, user = require_role(account, "founder")
        row = {**body.model_dump(mode="json"), "founder_id": str(user.id), "status": "open"}
        rows = execute(client.table("job_opening").insert(row))
        return rows[0]

    @app.patch("/founder/openings/{opening_id}")
    def update_opening(opening_id: UUID, body: OpeningStatusUpdate, account=Depends(authenticated_account)):
        client, user = require_role(account, "founder")
        rows = execute(
            client.table("job_opening").update({"status": body.status})
            .eq("opening_id", str(opening_id)).eq("founder_id", str(user.id))
        )
        if not rows:
            raise HTTPException(404, "Job opening not found.")
        return rows[0]

    @app.get("/founder/openings/{opening_id}/applications")
    def opening_applications(opening_id: UUID, account=Depends(authenticated_account)):
        client, user = require_role(account, "founder")
        get_founder_opening(client, opening_id, user.id)
        applications = execute(
            client.table("job_application").select("*").eq("opening_id", str(opening_id))
            .neq("status", "draft").order("created_at", desc=True)
        )
        if not applications:
            return []
        applicant_ids = list({application["applicant_id"] for application in applications})
        profiles = execute(
            supabase.table("applicant_public_profile").select("user_id,name,email").in_("user_id", applicant_ids),
            "Unable to load applicant profiles. Please try again.",
        )
        by_id = {profile["user_id"]: profile for profile in profiles}
        return [
            {**application, "applicant": by_id.get(application["applicant_id"], {"user_id": application["applicant_id"]})}
            for application in applications
        ]

    @app.patch("/founder/applications/{application_id}/decision")
    def decide_application(application_id: UUID, body: ApplicationDecision, account=Depends(authenticated_account)):
        client, user = require_role(account, "founder")
        rows = execute(
            client.table("job_application").select("application_id,opening_id,status")
            .eq("application_id", str(application_id))
        )
        if not rows:
            raise HTTPException(404, "Application not found.")
        if rows[0]["status"] == "draft":
            raise HTTPException(409, "A draft application cannot receive a decision.")
        get_founder_opening(client, rows[0]["opening_id"], user.id)
        decided_at = None if body.status == "pending" else datetime.now(timezone.utc).isoformat()
        updated = execute(
            client.table("job_application").update({"status": body.status, "decided_at": decided_at})
            .eq("application_id", str(application_id))
        )
        if not updated:
            raise HTTPException(404, "Application not found.")
        return updated[0]

    @app.get("/applications/mine")
    def my_applications(account=Depends(authenticated_account)):
        client, user = require_role(account, "applicant")
        return execute(
            client.table("job_application").select(
                "*,opening:job_opening(opening_id,title,company_name,description,status,questions)"
            ).eq("applicant_id", str(user.id)).order("updated_at", desc=True)
        )

    @app.post("/openings/{opening_id}/applications", status_code=201)
    def start_application(opening_id: UUID, account=Depends(authenticated_account)):
        client, user = require_role(account, "applicant")
        openings = execute(
            client.table("job_opening").select("opening_id").eq("opening_id", str(opening_id)).eq("status", "open")
        )
        if not openings:
            raise HTTPException(404, "This job is no longer open.")
        existing = execute(
            client.table("job_application").select("*").eq("opening_id", str(opening_id)).eq("applicant_id", str(user.id))
        )
        if existing:
            if existing[0]["status"] != "draft":
                raise HTTPException(409, "You have already submitted an application for this job.")
            return existing[0]
        rows = execute(client.table("job_application").insert({
            "opening_id": str(opening_id), "applicant_id": str(user.id), "answers": {},
        }))
        return rows[0]

    @app.patch("/applications/{application_id}/draft")
    def save_application_draft(application_id: UUID, body: ApplicationDraft, account=Depends(authenticated_account)):
        client, user = require_role(account, "applicant")
        application = get_applicant_application(client, application_id, user.id)
        if application["status"] != "draft":
            raise HTTPException(409, "Submitted applications can no longer be edited.")
        if application["opening"]["status"] != "open":
            raise HTTPException(409, "This job is closed; its draft can no longer be changed.")
        validate_answers(application["opening"]["questions"], body.answers, require_required=False)
        rows = execute(
            client.table("job_application").update({"answers": body.answers})
            .eq("application_id", str(application_id)).eq("applicant_id", str(user.id)).eq("status", "draft")
        )
        if not rows:
            raise HTTPException(409, "This application can no longer be edited.")
        return rows[0]

    @app.post("/applications/{application_id}/submit")
    def submit_application(application_id: UUID, account=Depends(authenticated_account)):
        client, user = require_role(account, "applicant")
        application = get_applicant_application(client, application_id, user.id)
        if application["status"] != "draft":
            raise HTTPException(409, "This application has already been submitted.")
        if application["opening"]["status"] != "open":
            raise HTTPException(409, "This job is closed; the application cannot be submitted.")
        validate_answers(application["opening"]["questions"], application["answers"], require_required=True)
        now = datetime.now(timezone.utc).isoformat()
        rows = execute(
            client.table("job_application").update({
                "status": "pending", "submitted_at": now, "decided_at": None,
            }).eq("application_id", str(application_id)).eq("applicant_id", str(user.id)).eq("status", "draft")
        )
        if not rows:
            raise HTTPException(409, "This application has already been submitted.")
        return rows[0]

    @app.get("/applications/{application_id}/documents")
    def application_documents(application_id: UUID, account=Depends(authenticated_account)):
        client, user = account
        application = get_accessible_application(client, application_id)
        if application["status"] == "draft" and application["applicant_id"] != str(user.id):
            raise HTTPException(404, "Application not found.")
        path = str(application["application_id"])
        try:
            files = client.storage.from_(DOCUMENT_BUCKET).list(path)
        except (StorageApiError, HTTPError):
            logger.warning("Unable to list application documents")
            raise HTTPException(503, "Unable to load application documents. Please try again.") from None
        names = {file.get("name") for file in files}
        return {kind: f"{kind}.pdf" in names for kind in DOCUMENT_TYPES}

    @app.post("/applications/{application_id}/documents/{document_type}", status_code=201)
    async def upload_application_document(
        application_id: UUID,
        document_type: str,
        request: Request,
        account=Depends(authenticated_account),
    ):
        client, user = require_role(account, "applicant")
        application = get_applicant_application(client, application_id, user.id)
        if application["status"] != "draft" or application["opening"]["status"] != "open":
            raise HTTPException(409, "Documents can only be uploaded to a draft for an open job.")
        path = document_path(application_id, document_type)
        if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/pdf":
            raise HTTPException(415, "Upload a PDF document.")
        content = bytearray()
        async for chunk in request.stream():
            content.extend(chunk)
            if len(content) > MAX_DOCUMENT_BYTES:
                raise HTTPException(413, "Each PDF must be 10 MB or smaller.")
        if not content.startswith(b"%PDF-"):
            raise HTTPException(415, "The uploaded file is not a valid PDF.")
        try:
            client.storage.from_(DOCUMENT_BUCKET).upload(
                path, bytes(content), {"content-type": "application/pdf", "upsert": "true"},
            )
        except (StorageApiError, HTTPError):
            logger.warning("Unable to upload application document")
            raise HTTPException(503, "Unable to upload the PDF. Please try again.") from None
        return {"ok": True, "document_type": document_type}

    @app.get("/applications/{application_id}/documents/{document_type}")
    def download_application_document(application_id: UUID, document_type: str, account=Depends(authenticated_account)):
        client, user = account
        path = document_path(application_id, document_type)
        application = get_accessible_application(client, application_id)
        if application["status"] == "draft" and application["applicant_id"] != str(user.id):
            raise HTTPException(404, "Document not found.")
        try:
            content = client.storage.from_(DOCUMENT_BUCKET).download(path)
        except StorageApiError as exc:
            if str(exc.status) == "404":
                raise HTTPException(404, "Document not found.") from None
            logger.warning("Unable to download application document")
            raise HTTPException(503, "Unable to download the PDF. Please try again.") from None
        except HTTPError:
            logger.warning("Unable to download application document")
            raise HTTPException(503, "Unable to download the PDF. Please try again.") from None
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{document_type}.pdf"'},
        )

    @app.delete("/applications/{application_id}/documents/{document_type}")
    def delete_application_document(application_id: UUID, document_type: str, account=Depends(authenticated_account)):
        client, user = require_role(account, "applicant")
        application = get_applicant_application(client, application_id, user.id)
        if application["status"] != "draft" or application["opening"]["status"] != "open":
            raise HTTPException(409, "Documents can only be removed from a draft for an open job.")
        path = document_path(application_id, document_type)
        try:
            client.storage.from_(DOCUMENT_BUCKET).remove([path])
        except (StorageApiError, HTTPError):
            logger.warning("Unable to remove application document")
            raise HTTPException(503, "Unable to remove the PDF. Please try again.") from None
        return {"ok": True}
