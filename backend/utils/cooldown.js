const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_TWENTY_DAYS_MS = 120 * 24 * 60 * 60 * 1000;

/**
 * Checks if a user is within their donation cooldown period.
 * @param {Date|string} lastDonationDate 
 * @param {string} gender 
 * @returns {boolean}
 */
const isWithinCooldown = (lastDonationDate, gender = "Male") => {
  if (!lastDonationDate) return false;
  const last = new Date(lastDonationDate).getTime();
  if (Number.isNaN(last)) return false;
  const cooldownMs = gender === "Female" ? ONE_TWENTY_DAYS_MS : NINETY_DAYS_MS;
  const isCooledDown = Date.now() - last < cooldownMs;
  console.log(`[Cooldown Check] last=${last}, now=${Date.now()}, diff=${Date.now() - last}, cooldownMs=${cooldownMs}, result=${isCooledDown}`);
  return isCooledDown;
};

/**
 * Returns the date when the donor will be eligible again.
 */
const getCooldownEndDate = (lastDonationDate, gender = "Male") => {
  if (!lastDonationDate) return new Date();
  const last = new Date(lastDonationDate).getTime();
  const cooldownMs = gender === "Female" ? ONE_TWENTY_DAYS_MS : NINETY_DAYS_MS;
  return new Date(last + cooldownMs);
};

module.exports = {
  isWithinCooldown,
  getCooldownEndDate,
  NINETY_DAYS_MS,
  ONE_TWENTY_DAYS_MS,
};
