const { supabase } = require("./supabase");

async function getUserTotalAmount(id) {
  let { data, error } = await supabase
    .from("user")
    .select("total_amount")
    .eq("id", id);
  if (error) {
    console.error(error);
    throw new Error(error);
  }
  return data[0];
}

async function getTopBuyers(count = 10) {
  let { data, error } = await supabase
    .from("user")
    .select("discord_uid,total_amount")
    .order("total_amount", { ascending: false })
    .order("id", { ascending: true })
    .range(0, count - 1);
  if (error) {
    console.error(error);
    throw new Error(error);
  }
  return data;
}

module.exports = {
  getUserTotalAmount,
  getTopBuyers,
};
