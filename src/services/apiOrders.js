const { PAGE_SIZE } = require("../utils/constant");
const { supabase } = require("./supabase");
const { addDays } = require("../utils/helpers");

async function getOrdersByDiscordUserId(id, pageNo = 1, pageSize = PAGE_SIZE) {
  let { data, error, count } = await supabase
    .from("order")
    .select("item_name,amount,created_at,user!inner()", {
      count: "exact",
    })
    .like("user.discord_uid", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((pageNo - 1) * pageSize, pageNo * pageSize - 1);

  if (error) {
    console.error(error);
    throw new Error(error);
  }

  return {
    data,
    pageNo,
    pageSize,
    totalElements: count,
    totalPages: Math.ceil(count / pageSize),
  };
}

// options: {id: discord user id, platform: platform name, (email)}
async function getOrdersByPlatformAndEmail(
  options,
  pageNo = 1,
  pageSize = PAGE_SIZE
) {
  const { id, platform, email } = options;
  let query = supabase
    .from("order")
    .select("item_name,amount,created_at,expires_at,email,user!inner()", {
      count: "exact",
    })
    .like("user.discord_uid", id)
    .like("platform", platform);

  if (email) {
    query = query.like("email", email);
  }

  let { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((pageNo - 1) * pageSize, pageNo * pageSize - 1);

  if (error) {
    console.error(error);
    throw new Error(error);
  }

  return {
    data,
    pageNo,
    pageSize,
    totalElements: count,
    totalPages: Math.ceil(count / pageSize),
  };
}

async function getOrders(pageNo = 1, pageSize = PAGE_SIZE) {
  let { data, error, count } = await supabase
    .from("order")
    .select("id,item_name,amount,created_at,user!inner(discord_uid)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((pageNo - 1) * pageSize, pageNo * pageSize - 1);

  if (error) {
    console.error(error);
    throw new Error(error);
  }

  return {
    data,
    pageNo,
    pageSize,
    totalElements: count,
    totalPages: Math.ceil(count / pageSize),
  };
}

// Get nearly expired orders,
// but hasn't reminded for renewal yet
async function getNearlyExpiredOrders() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const fromDate = addDays(now, 1);
  fromDate.setUTCHours(0, 0, 0, 0);
  const toDate = addDays(fromDate, 1);

  let { data, error } = await supabase
    .from("order")
    .select("id,expires_at")
    .gte("expires_at", fromDate.toISOString())
    .lte("expires_at", toDate.toISOString())
    .eq("renewal_reminded", false)
    .order("expires_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error(error);
  }

  return data;
}

async function getOrderById(id) {
  let { data, error } = await supabase
    .from("order")
    .select(
      "id,item_name,amount,created_at,expires_at,email,user!inner(discord_uid)"
    )
    .eq("id", id);

  if (error) {
    console.error(error);
    throw new Error(error);
  }

  return data[0];
}

// order: {itemName, amount, platform, email}
async function addOrder(discordUid, orderData) {
  let { data, error: findIdError } = await supabase
    .from("user")
    .select("id")
    .like("discord_uid", discordUid);
  if (findIdError) {
    console.error(findIdError);
    throw new Error(findIdError);
  }
  let userId;

  if (data.length === 0) {
    let { data, error: insertUserError } = await supabase
      .from("user")
      .insert({ discord_uid: discordUid })
      .select();

    if (insertUserError) {
      console.error(insertUserError);
      throw new Error(insertUserError);
    }
    userId = data[0].id;
  } else {
    userId = data[0].id;
  }

  const {
    itemName,
    amount,
    platform = null,
    expiresAt = null,
    email = null,
  } = orderData;

  const { data: order, error: addOrderError } = await supabase
    .from("order")
    .insert([
      {
        user_id: userId,
        item_name: itemName,
        amount,
        platform,
        expires_at: expiresAt,
        email,
        renewal_reminded: expiresAt ? false : null,
      },
    ])
    .select();

  if (addOrderError) {
    console.error(addOrderError);
    throw new Error(addOrderError);
  }

  return order[0];
}

// orderData: object
async function updateOrder(id, orderData) {
  const { data, error } = await supabase
    .from("order")
    .update(orderData)
    .eq("id", id)
    .select();

  if (error) {
    console.error(error);
    throw new Error(error);
  }

  return data[0];
}

async function deleteOrder(id) {
  const { data, error } = await supabase
    .from("order")
    .delete()
    .eq("id", id)
    .select("id,user_id,item_name,amount,created_at,user(id,discord_uid)");

  if (error) {
    console.error(error);
    throw new Error(error);
  }

  if (data.length === 0) return null;
  return data[0];
}

module.exports = {
  getOrdersByDiscordUserId,
  getOrdersByPlatformAndEmail,
  getNearlyExpiredOrders,
  getOrders,
  getOrderById,
  addOrder,
  deleteOrder,
  updateOrder,
};
