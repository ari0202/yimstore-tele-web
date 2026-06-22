CREATE OR REPLACE FUNCTION check_cooldown_validity(
    last_claim_time TIMESTAMPTZ,
    cooldown_val INTEGER,
    cooldown_unit cooldown_unit_enum
) RETURNS BOOLEAN AS $$
DECLARE
    interval_str TEXT;
    cooldown_passed BOOLEAN;
BEGIN
    interval_str := cooldown_val || ' ' || cooldown_unit;
    cooldown_passed := (NOW() >= (last_claim_time + interval_str::INTERVAL));
    RETURN cooldown_passed;
END;
$$ LANGUAGE plpgsql;
