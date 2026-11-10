import os
import sys
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "sb_publishable_test")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import user_client
from job_routes import OpeningInput, validate_answers


class JobRouteValidationTests(unittest.TestCase):
    def test_opening_fields_are_trimmed_and_question_ids_are_unique(self):
        question_id = uuid4()
        opening = OpeningInput(
            company_name="  Acme  ",
            title="  Engineer  ",
            description="  Build things  ",
            questions=[{
                "id": str(question_id),
                "label": "  Why this role?  ",
                "type": "long_text",
                "required": True,
            }],
        )
        self.assertEqual(opening.company_name, "Acme")
        self.assertEqual(opening.questions[0].label, "Why this role?")

        with self.assertRaises(ValidationError):
            OpeningInput(
                company_name="Acme",
                title="Engineer",
                description="Build things",
                questions=[
                    {"id": str(question_id), "label": "First", "type": "short_text"},
                    {"id": str(question_id), "label": "Second", "type": "short_text"},
                ],
            )

    def test_required_text_and_boolean_answers_are_validated(self):
        text_id = str(uuid4())
        boolean_id = str(uuid4())
        questions = [
            {"id": text_id, "label": "Why this role?", "type": "long_text", "required": True},
            {"id": boolean_id, "label": "Can you relocate?", "type": "yes_no", "required": True},
        ]
        validate_answers(questions, {text_id: "I am interested.", boolean_id: False}, require_required=True)
        with self.assertRaises(HTTPException):
            validate_answers(questions, {text_id: "  ", boolean_id: True}, require_required=True)
        with self.assertRaises(HTTPException):
            validate_answers(questions, {text_id: "Answer", boolean_id: "yes"}, require_required=True)
        with self.assertRaises(HTTPException):
            validate_answers(
                questions,
                {text_id: "Answer", boolean_id: True, "unknown": "value"},
                require_required=False,
            )

    def test_url_answers_must_use_http_or_https(self):
        question_id = str(uuid4())
        question = [{"id": question_id, "label": "Portfolio", "type": "url", "required": False}]
        validate_answers(question, {question_id: "https://example.com"}, require_required=False)
        with self.assertRaises(HTTPException):
            validate_answers(question, {question_id: "ftp://example.com"}, require_required=False)
        with self.assertRaises(HTTPException):
            validate_answers(question, {question_id: "https://"}, require_required=False)

    def test_per_user_client_sends_the_verified_token_to_storage(self):
        client = user_client("unit-test-token")
        self.assertEqual(client.storage._headers.get("Authorization"), "Bearer unit-test-token")


if __name__ == "__main__":
    unittest.main()
