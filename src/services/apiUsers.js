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

module.exports = {
  getUserTotalAmount,
};
