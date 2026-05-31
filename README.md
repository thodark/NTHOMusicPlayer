<div align="center">

<img width="140" src="https://em-content.zobj.net/source/apple/391/jack-o-lantern_1f383.png" alt="Pumpkin Player Logo" />

# 🎵 Pumpkin Player

**Một trình phát nhạc web đầy chất riêng — được xây dựng bởi một sinh viên IT năm nhất.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)

</div>

---

## 👤 Về tác giả

Chào, mình là **Yoei** — sinh viên IT năm nhất tại **Trường Cao đẳng Kỹ thuật Cao Thắng**, TP. Hồ Chí Minh.

Pumpkin Player là sản phẩm web đầu tay mà mình cảm thấy tự hào nhất cho đến thời điểm này. Còn nhiều thứ chưa hoàn hảo, nhưng mỗi dòng code trong dự án này đều là một thứ mình thực sự học được — và thực sự thích làm.

> 🎃 **Fun fact:** Cái tên *"Pumpkin"* không phải ngẫu nhiên. Nó được lấy từ bí danh của một người mà mình từng trân trọng. Chỉ vậy thôi — cứ coi như một Easter egg nho nhỏ của project này.

---

## 🎧 Về Pumpkin Player

**Pumpkin Player** là một trình phát nhạc web mang giao diện tối giản nhưng đầy đủ tính năng, thiết kế theo phong cách **glassmorphism** với bảng màu tím–đen sang trọng.

Điểm đặc biệt là ứng dụng kết hợp thư viện nhạc cá nhân với tính năng **chia sẻ cộng đồng qua Firebase** — người dùng có thể upload nhạc lên và mọi người trong cộng đồng cùng nghe chung. Ngoài ra còn tích hợp **trích xuất thông tin bài hát từ YouTube** chỉ bằng một đường link.

### ✨ Tính năng nổi bật

- 🎵 **Phát nhạc đầy đủ** — play/pause, next/prev, shuffle, repeat (none / all / one)
- 🎛️ **Bộ chỉnh âm (EQ)** với 5 preset: Flat, Bass Boost, Vocal, Acoustic, Electronic — cùng chỉnh thủ công bass/mid/treble
- 🔥 **Thư viện cộng đồng Firebase** — đăng nhập bằng Google, upload và chia sẻ nhạc của bạn
- 📺 **Nhập nhạc từ YouTube** — dán link là xong, metadata tự động điền
- ❤️ **Danh sách yêu thích** và lịch sử nghe gần đây
- 🌐 **Phân loại nhạc** Việt / US-UK
- 📱 **Responsive** — hoạt động tốt trên cả desktop lẫn mobile

---

## 🛠️ Công nghệ sử dụng

### Frontend

| Công nghệ | Vai trò |
|---|---|
| **React 19** | Thư viện UI chính |
| **TypeScript 5.8** | Typed JavaScript, giúp code chắc chắn hơn |
| **Vite 6** | Build tool & dev server cực nhanh |
| **Tailwind CSS v4** | Utility-first CSS, style toàn bộ giao diện |
| **Framer Motion** | Animation mượt mà cho các hiệu ứng UI |
| **Lucide React** | Bộ icon nhất quán và nhẹ |

### Backend

| Công nghệ | Vai trò |
|---|---|
| **Express.js** | Server Node.js xử lý API |
| **tsx** | Chạy TypeScript trực tiếp trên Node |
| **play-dl** | Lấy thông tin bài hát từ YouTube |
| **@distube/ytdl-core** | Stream và trích xuất audio YouTube |

### Dịch vụ đám mây

| Dịch vụ | Vai trò |
|---|---|
| **Firebase Authentication** | Đăng nhập Google OAuth |
| **Cloud Firestore** | Lưu trữ dữ liệu nhạc cộng đồng theo thời gian thực |
| **Firebase Storage** | Lưu file audio & ảnh bìa người dùng upload |
| **Google Gemini API** | Tích hợp AI (Gemini) phía server |

---

## 🚀 Chạy local

**Yêu cầu:** Node.js

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env.local và điền các biến môi trường (xem .env.example)
cp .env.example .env.local

# 3. Chạy development server
npm run dev
```

Mở trình duyệt tại `http://localhost:3000` là xong.

---

## 📁 Cấu trúc project

```
ntho-music-player/
├── src/
│   ├── components/
│   │   ├── MainScreen.tsx      # Màn hình chính (danh sách nhạc)
│   │   ├── PlayerBar.tsx       # Thanh điều khiển phát nhạc
│   │   ├── Sidebar.tsx         # Sidebar điều hướng & EQ
│   │   └── PumpkinLogo.tsx     # Logo bí ngô :)
│   ├── context/
│   │   └── AudioPlaybackContext.tsx  # Global state: audio, auth, firebase
│   ├── firebase.ts             # Khởi tạo Firebase
│   ├── types.ts                # TypeScript interfaces
│   ├── data.ts                 # Dữ liệu playlist mặc định
│   └── App.tsx                 # Root component
├── server.ts                   # Express server (API YouTube)
├── vite.config.ts
└── package.json
```

---

<div align="center">

Made with 🎃 by **Yoei** — Cao đẳng Kỹ thuật Cao Thắng, Khóa 2025

</div>
