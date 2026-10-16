import unittest
from datetime import datetime
from unittest.mock import patch

import parser


class FakePopConnection:
    def __init__(self):
        self.deleted = []

    def dele(self, message_index):
        self.deleted.append(message_index)


class FakeCursor:
    def __init__(self, results):
        self.results = iter(results)
        self.closed = False

    def execute(self, *_args):
        pass

    def fetchone(self):
        return next(self.results)

    def close(self):
        self.closed = True


class FakeDatabaseConnection:
    def __init__(self, cursor):
        self.fake_cursor = cursor
        self.closed = False

    def cursor(self):
        return self.fake_cursor

    def rollback(self):
        pass

    def close(self):
        self.closed = True


class ProcesarReporteCorreoTests(unittest.TestCase):
    def test_keeps_email_when_database_save_fails(self):
        pop_connection = FakePopConnection()

        with patch.object(parser, "registrar_reporte_en_db", return_value=False):
            processed = parser.procesar_reporte_correo(pop_connection, 7, ("SERIE", 10, 50))

        self.assertFalse(processed)
        self.assertEqual(pop_connection.deleted, [])

    def test_deletes_email_after_successful_save(self):
        pop_connection = FakePopConnection()

        with patch.object(parser, "registrar_reporte_en_db", return_value=True):
            processed = parser.procesar_reporte_correo(pop_connection, 7, ("SERIE", 10, 50))

        self.assertTrue(processed)
        self.assertEqual(pop_connection.deleted, [7])

    def test_treats_stale_report_as_successfully_processed(self):
        cursor = FakeCursor([
            (1,),
            (100, 70, datetime.now().date()),
            None,
        ])
        connection = FakeDatabaseConnection(cursor)

        with patch.object(parser, "get_database_params", return_value={}), patch.object(
            parser.psycopg2, "connect", return_value=connection
        ):
            saved = parser.registrar_reporte_en_db("SERIE", 90, 60)

        self.assertTrue(saved)
        self.assertTrue(cursor.closed)
        self.assertTrue(connection.closed)


if __name__ == "__main__":
    unittest.main()