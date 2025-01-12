const { ROLE_NOT_FOUND_MSG } = require("./constant");

async function addRole(guild, member, roleId, displayName) {
  const role = guild.roles.cache.get(roleId);
  if (!role) {
    throw new Error(
      `${ROLE_NOT_FOUND_MSG}${displayName ? ": " + displayName : ""}`
    );
  }

  if (!member.roles.cache.has(roleId)) {
    try {
      await member.roles.add(role);
      return true;
    } catch (err) {
      throw new Error(`Thêm <@${member.user.id}> vào <@&${roleId}> thất bại`);
    }
  }
  return false;
}

async function removeRole(guild, member, roleId, displayName) {
  const role = guild.roles.cache.get(roleId);
  if (!role) {
    throw new Error(
      `${ROLE_NOT_FOUND_MSG}${displayName ? ": " + displayName : ""}`
    );
  }

  if (member.roles.cache.has(roleId)) {
    try {
      await member.roles.remove(role);
      return true;
    } catch (err) {
      throw new Error(`Gỡ <@&${roleId}> khỏi <@${member.user.id}> thất bại`);
    }
  }
  return false;
}

module.exports = {
  addRole,
  removeRole,
};
