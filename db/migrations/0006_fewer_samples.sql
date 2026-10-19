-- Fewer sample places: one per category (10 instead of 19). The nine dropped
-- from the code are removed here too, or they would show up in search as if
-- they were new registered places. Only the copies the admin's sample import
-- made are deleted (its placeholder phone or its note); a real place is never
-- touched. Their hours, services, staff and images go with them; past
-- bookings stay (they keep the place's address as plain text).
DELETE FROM businesses
WHERE slug IN (
    'setgel-salon', 'nomad-barber', 'tsetseg-nail', 'nar-spa', 'sod-beauty',
    'erdene-hair', 'khurel-barber', 'tsagaan-shud-dental', 'bat-motor'
  )
  AND (phone = '99000000' OR review_note IN ('Жишээ бизнес', 'Жишээ газар'));
