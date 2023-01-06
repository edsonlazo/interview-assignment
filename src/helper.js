/**
 *
 * @param {profile} profile
 * @returns true if the profile belongs to a client
 */
function isClient(profile) {
  return profile.type === "client";
}

module.exports.isClient = isClient;
