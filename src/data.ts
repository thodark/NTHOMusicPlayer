export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: 'VN' | 'US';
  audioSrc: string;
  coverSrc: string;
}

export const myPlaylist: Track[] = [
  {
    id: "duong-mot-chieu",
    title: "Đường Một Chiều",
    artist: "Marcus (Cover) · Nam Trương",
    genre: "VN",
    audioSrc: "./music/duong-mot-chieu/audio.mp3",
    coverSrc: "./music/duong-mot-chieu/cover.jpg"
  },
  {
    id: "khong-buong",
    title: "Không Buông",
    artist: "Hngle x Ari",
    genre: "VN",
    audioSrc: "./music/khong-buong/audio.mp3",
    coverSrc: "./music/khong-buong/cover.jpg"
  },
  {
    id: "nang-tho",
    title: "Nàng Thơ",
    artist: "Hoàng Dũng",
    genre: "VN",
    audioSrc: "./music/nang-tho/audio.mp3",
    coverSrc: "./music/nang-tho/cover.jpg"
  },
  {
    id: "nao-ca-vang",
    title: "Não Cá Vàng",
    artist: "Marcus (Cover) · OnlyC x Lou Hoàng",
    genre: "VN",
    audioSrc: "./music/nao-ca-vang/audio.mp3",
    coverSrc: "./music/nao-ca-vang/cover.jpg"
  },
  {
    id: "nghe-bai-nay-di-em",
    title: "Nghe Bài Này Đi Em",
    artist: "Specter x Chu x Củ Cải",
    genre: "VN",
    audioSrc: "./music/nghe-bai-nay-di-em/audio.mp3",
    coverSrc: "./music/nghe-bai-nay-di-em/cover.jpg"
  },
  {
    id: "nguoi-dau-tien",
    title: "Người Đầu Tiên",
    artist: "Juky San feat. buitruonglinh",
    genre: "VN",
    audioSrc: "./music/nguoi-dau-tien/audio.mp3",
    coverSrc: "./music/nguoi-dau-tien/cover.jpg"
  },
  {
    id: "pc-10-ngan-nam",
    title: "10 Ngàn Năm",
    artist: "PC · Prod. Duckie",
    genre: "VN",
    audioSrc: "./music/pc-10-ngan-nam/audio.mp3",
    coverSrc: "./music/pc-10-ngan-nam/cover.jpg"
  },
  {
    id: "vet-thuong-lofi",
    title: "Vết Thương (Lofi)",
    artist: "Fishy x Frésh",
    genre: "VN",
    audioSrc: "./music/vet-thuong-lofi/audio.mp3",
    coverSrc: "./music/vet-thuong-lofi/cover.jpg"
  },
  {
    id: "blue-tequila",
    title: "Blue Tequila",
    artist: "Táo",
    genre: "VN",
    audioSrc: "./music/blue-tequila/audio.mp3",
    coverSrc: "./music/blue-tequila/cover.jpg"
  },
  {
    id: "roi-ta-se-ngam-phao-hoa-cung-nhau",
    title: "RỒI TA SẼ NGẮM PHÁO HOA CÙNG NHAU",
    artist: "Olew",
    genre: "VN",
    audioSrc: "./music/roi-ta-se-ngam-phao-hoa-cung-nhau/audio.mp3",
    coverSrc: "./music/roi-ta-se-ngam-phao-hoa-cung-nhau/cover.jpg"
  },
  {
    id: "nuts",
    title: "nuts",
    artist: "Lil Peep",
    genre: "US",
    audioSrc: "./music/nuts/audio.mp3",
    coverSrc: "./music/nuts/cover.jpg"
  },
  {
    id: "double-take",
    title: "Double take",
    artist: "Dhruv",
    genre: "US",
    audioSrc: "./music/double-take/audio.mp3",
    coverSrc: "./music/double-take/cover.jpg"
  },
  {
    id: "pho-cu-con-anh",
    title: "Phố Cũ Còn Anh",
    artist: "(Freak D Lofi Ver.) - Quinn ft Chilly",
    genre: "VN",
    audioSrc: "./music/pho-cu-con-anh/audio.mp3",
    coverSrc: "./music/pho-cu-con-anh/cover.jpg"
  },
  {
    id: "vi-anh-dau-co-biet",
    title: "Vì Anh Đâu Có Biết",
    artist: "Madihu (Feat. Vũ.)",
    genre: "VN",
    audioSrc: "./music/vi-anh-dau-co-biet/audio.mp3",
    coverSrc: "./music/vi-anh-dau-co-biet/cover.jpg"
  },
  {
    id: "chuyen-doi-ta",
    title: "Chuyện Đôi Ta",
    artist: "Emcee L (Da LAB) ft Muộii",
    genre: "VN",
    audioSrc: "./music/chuyen-doi-ta/audio.mp3",
    coverSrc: "./music/chuyen-doi-ta/cover.jpg"
  },
  {
    id: "vung-an-toan",
    title: "Vùng An Toàn",
    artist: "B Ray (ft. V#) - Prod. Hipz",
    genre: "VN",
    audioSrc: "./music/vung-an-toan/audio.mp3",
    coverSrc: "./music/vung-an-toan/cover.jpg"
  },
  {
    id: "lam-gi-co-ai-thuong-em",
    title: "Làm gì có ai thương em",
    artist: "Tóc Tiên x Touliver x Rap $onday",
    genre: "VN",
    audioSrc: "./music/lam-gi-co-ai-thuong-em/audio.mp3",
    coverSrc: "./music/lam-gi-co-ai-thuong-em/cover.jpg"
  },
  {
    id: "the-way-life-goes",
    title: "The Way Life Goes",
    artist: "Lil Uzi Vert, Oh Wonder",
    genre: "US",
    audioSrc: "./music/the-way-life-goes/audio.mp3",
    coverSrc: "./music/the-way-life-goes/cover.png"
  },
  {
    id: "anh-cung-dau-co-muon-tin",
    title: "Anh Cũng Đâu Có Muốn Tin?",
    artist: "Dab (feat. Helinn)",
    genre: "VN",
    audioSrc: "./music/anh-cung-dau-co-muon-tin/audio.mp3",
    coverSrc: "./music/anh-cung-dau-co-muon-tin/cover.jpg"
  }
];
