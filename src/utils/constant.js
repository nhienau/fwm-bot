const BANK_INFO = {
  minh: {
    bankId: "ICB",
    bankName: "VIETTINBANK",
    accountNumber: "109882294922",
    accountName: "NGO VIET HOANG",
  },
  phong: {
    bankId: "MB",
    bankName: "MB BANK",
    accountNumber: "029736609999",
    accountName: "DO TRAN HAI PHONG",
  },
};
const EMBED_COLOR = 0x5865f2;
const EMBED_COLOR_SUCCESS = 0x248045;
const EMBED_COLOR_DANGER = 0xda373c;
const LIST_COMMANDS = [
  {
    name: "history",
    description: "Xem lịch sử mua hàng",
  },
  {
    name: "pick",
    description: "Chọn 1 lựa chọn ngẫu nhiên",
  },
  {
    name: "qr",
    description: "Tạo QR thanh toán đơn hàng",
  },
];
const PAGE_SIZE = 15;
const PAGES_TO_SKIP = 5;
const NO_ORDERS_FOUND_MSG = "Người dùng chưa có đơn hàng nào";
const INTERACTION_INACTIVE_MSG = "Tin nhắn này không còn hoạt động";
const INTERACTION_NOT_ALLOWED_MSG = "Bạn không thể tương tác với tin nhắn này";
const INTERACTION_VALID_TIME = 180000; // 3 * 60 * 1000
const INVALID_ITEM_NAME_MSG =
  "Tên mặt hàng cần viết liền, không dấu (ví dụ: owo5m, nitro1thang)";
const MISSING_ARGS_MSG = "Thiếu dữ liệu";
const INVALID_DISCORD_UID_MSG = "ID Discord không hợp lệ hoặc không tồn tại";
const BUYER_ROLE_ID_NOT_FOUND_MSG = "Không tìm thấy ID của role buyer";
const RICH_BUYER_ROLE_ID_NOT_FOUND_MSG =
  "Không tìm thấy ID của role rich buyer";
const ROLE_NOT_FOUND_MSG = "Không tìm thấy role";
const DISCORD_SERVER_URL = "https://discord.gg/FwMStore";
const CONFIG_FILE_PATH = "./assets/config.json";
const DELETE_MESSAGE_DELAY = 5000;

module.exports = {
  BANK_INFO,
  EMBED_COLOR,
  EMBED_COLOR_SUCCESS,
  EMBED_COLOR_DANGER,
  LIST_COMMANDS,
  PAGE_SIZE,
  PAGES_TO_SKIP,
  NO_ORDERS_FOUND_MSG,
  INTERACTION_INACTIVE_MSG,
  INTERACTION_NOT_ALLOWED_MSG,
  INTERACTION_VALID_TIME,
  INVALID_ITEM_NAME_MSG,
  MISSING_ARGS_MSG,
  INVALID_DISCORD_UID_MSG,
  BUYER_ROLE_ID_NOT_FOUND_MSG,
  RICH_BUYER_ROLE_ID_NOT_FOUND_MSG,
  ROLE_NOT_FOUND_MSG,
  DISCORD_SERVER_URL,
  CONFIG_FILE_PATH,
  DELETE_MESSAGE_DELAY,
};
