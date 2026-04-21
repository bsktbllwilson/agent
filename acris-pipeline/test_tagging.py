"""Unit tests for sync.py tagging/classification helpers."""

import unittest

from sync import (
    classify_beneficial_owner,
    classify_entity,
    make_bbl,
)


class EntityClassificationTests(unittest.TestCase):
    def test_none_and_empty(self):
        self.assertEqual(classify_entity(None), "Unknown")
        self.assertEqual(classify_entity(""), "Unknown")

    def test_trust_wins_over_llc(self):
        self.assertEqual(classify_entity("SMITH FAMILY TRUST LLC"), "Trust")

    def test_llc_variants(self):
        self.assertEqual(classify_entity("123 PARK LLC"), "LLC")
        self.assertEqual(classify_entity("123 PARK L.L.C."), "LLC")
        self.assertEqual(classify_entity("ACME HOLDINGS"), "LLC")
        self.assertEqual(classify_entity("ACME LIMITED"), "LLC")

    def test_corp(self):
        self.assertEqual(classify_entity("ACME INC"), "Corp")
        self.assertEqual(classify_entity("ACME CORPORATION"), "Corp")

    def test_partnership(self):
        self.assertEqual(classify_entity("SMITH PARTNERS LP"), "Partnership")
        self.assertEqual(classify_entity("SMITH L.P."), "Partnership")

    def test_individual(self):
        self.assertEqual(classify_entity("JOHN SMITH"), "Individual")

    def test_trust_keywords(self):
        self.assertEqual(classify_entity("JANE DOE REVOCABLE TRUST"), "Trust")
        self.assertEqual(classify_entity("SMITH U/T/A 1999"), "Trust")


class BeneficialOwnerTests(unittest.TestCase):
    def test_institutional_beats_everything(self):
        self.assertEqual(
            classify_beneficial_owner("BLACKSTONE HOLDINGS LLC", None, None),
            "Institutional",
        )

    def test_foreign_from_name(self):
        self.assertEqual(
            classify_beneficial_owner("BVI HOLDINGS LTD", None, None),
            "Foreign-inferred",
        )

    def test_foreign_from_address(self):
        self.assertEqual(
            classify_beneficial_owner("ACME LLC", "1 Road, CAYMAN ISLANDS", None),
            "Foreign-inferred",
        )

    def test_sponsor_seller(self):
        self.assertEqual(
            classify_beneficial_owner("ACME LLC", None, "123 PARK SPONSOR LLC"),
            "Developer/sponsor",
        )

    def test_domestic_individual(self):
        self.assertEqual(
            classify_beneficial_owner("JOHN SMITH", None, None),
            "Domestic individual",
        )

    def test_trust_is_domestic_individual(self):
        self.assertEqual(
            classify_beneficial_owner("SMITH FAMILY TRUST", None, None),
            "Domestic individual",
        )

    def test_domestic_entity_shielded(self):
        self.assertEqual(
            classify_beneficial_owner("123 PARK LLC", None, None),
            "Domestic entity-shielded",
        )
        self.assertEqual(
            classify_beneficial_owner("ACME CORP", None, None),
            "Domestic entity-shielded",
        )

    def test_unknown(self):
        self.assertEqual(classify_beneficial_owner(None, None, None), "Unknown")

    def test_institutional_priority_over_foreign(self):
        # Blackstone with a Cayman address should still be Institutional.
        self.assertEqual(
            classify_beneficial_owner("BLACKSTONE LLC", "CAYMAN", None),
            "Institutional",
        )

    def test_foreign_priority_over_sponsor(self):
        # Spec says institutional > foreign > sponsor.
        self.assertEqual(
            classify_beneficial_owner("BVI LTD", None, "SPONSOR LLC"),
            "Foreign-inferred",
        )


class BBLTests(unittest.TestCase):
    def test_happy_path(self):
        self.assertEqual(make_bbl("1", "123", "45"), "1001230045")

    def test_already_padded(self):
        self.assertEqual(make_bbl("3", "01234", "0001"), "3012340001")

    def test_invalid_returns_none(self):
        self.assertIsNone(make_bbl(None, "1", "1"))
        self.assertIsNone(make_bbl("1", None, "1"))
        self.assertIsNone(make_bbl("1", "abc", "1"))


if __name__ == "__main__":
    unittest.main()
