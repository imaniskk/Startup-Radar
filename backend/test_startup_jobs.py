"""Run: python -m unittest test_startup_jobs -v (no credentials/network required)."""

import importlib.util
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient


spec = importlib.util.spec_from_file_location("startup_jobs_test_app", Path(__file__).with_name("main.py"))
module = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, {"database": SimpleNamespace(supabase=MagicMock())}):
    spec.loader.exec_module(module)

STARTUP_ID = "f23c940b-8ddc-54c3-81ca-4ae1a7b834f9"


class StartupJobsTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(module.app)
        self.startup_query = MagicMock()
        self.job_query = MagicMock()
        for query in (self.startup_query, self.job_query):
            for method in ("select", "eq", "limit", "or_", "order"):
                getattr(query, method).return_value = query
        self.startup_query.execute.return_value = SimpleNamespace(data=[{
            "startup_id": STARTUP_ID, "name": "[DEMO] Example",
            "description": "[DEMO] Fictional startup.",
        }])
        self.job_query.execute.return_value = SimpleNamespace(data=[])
        self.database = MagicMock()
        self.database.table.side_effect = lambda table: {
            "startup": self.startup_query, "job_listing": self.job_query,
        }[table]
        self.patch = patch.object(module, "supabase", self.database)
        self.patch.start()
        self.addCleanup(self.patch.stop)

    def test_returns_database_jobs_and_scopes_query_to_startup(self):
        self.job_query.execute.return_value = SimpleNamespace(data=[{
            "job_id": "demo-job", "startup_id": STARTUP_ID,
            "title": "Software Engineering Intern",
        }])
        response = self.client.get("/startups/{}/jobs".format(STARTUP_ID))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_demo"])
        self.assertEqual(response.json()["jobs"][0]["title"], "Software Engineering Intern")
        self.job_query.eq.assert_any_call("startup_id", STARTUP_ID)
        self.job_query.eq.assert_any_call("status", "open")
        self.assertIn("application_deadline.is.null,application_deadline.gt.", self.job_query.or_.call_args[0][0])

    def test_existing_startup_with_no_jobs_is_successful_empty_result(self):
        response = self.client.get("/startups/{}/jobs".format(STARTUP_ID))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["jobs"], [])

    def test_missing_startup_returns_404_without_querying_jobs(self):
        self.startup_query.execute.return_value = SimpleNamespace(data=[])
        response = self.client.get("/startups/{}/jobs".format(STARTUP_ID))
        self.assertEqual(response.status_code, 404)
        self.job_query.execute.assert_not_called()

    def test_invalid_uuid_returns_422_without_database_call(self):
        response = self.client.get("/startups/not-a-uuid/jobs")
        self.assertEqual(response.status_code, 422)
        self.database.table.assert_not_called()

    def test_database_failure_is_safe_retryable_error(self):
        self.job_query.execute.side_effect = RuntimeError("private connection detail")
        response = self.client.get("/startups/{}/jobs".format(STARTUP_ID))
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private connection detail", response.text)

    def test_real_startup_is_not_labeled_as_demo(self):
        self.startup_query.execute.return_value = SimpleNamespace(data=[{
            "startup_id": STARTUP_ID, "name": "A real YC company", "description": "Company description.",
        }])
        response = self.client.get("/startups/{}/jobs".format(STARTUP_ID))
        self.assertFalse(response.json()["is_demo"])

    def test_frontend_on_vite_fallback_port_can_request_jobs(self):
        response = self.client.get(
            "/startups/{}/jobs".format(STARTUP_ID),
            headers={"Origin": "http://localhost:5174"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5174")


if __name__ == "__main__":
    unittest.main()
