import type { AppMode } from "./modes";

export type Person = {
  id: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  avatar: string;
  cover: string;
  gender: "male" | "female";
  modes: AppMode[];
  verified: boolean;
  walied?: boolean;
  isWali?: boolean;
  kidsAges?: string[];
};

export type FeedPost = {
  id: string;
  authorId: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  mode: AppMode;
};

export type Thread = {
  id: string;
  kind: "dm" | "group";
  mode: AppMode;
  lastMessage: string;
  timeAgo: string;
  unread: number;
  online: boolean;
  personId?: string;       // DM
  members?: string[];      // group: includes wali
  title?: string;          // group display title
  hasWali?: boolean;       // marker for Nikah groups
};

export type Message = {
  id: string;
  threadId: string;
  fromMe: boolean;
  text: string;
  time: string;
  fromId?: string;         // for group messages
  system?: boolean;        // system notice (e.g. "Wali added")
};

const img = (seed: string, w = 800, h = 800) =>
  `https://images.unsplash.com/photo-${seed}?w=${w}&h=${h}&fit=crop&auto=format`;

export const PEOPLE: Person[] = [
  {
    id: "p1",
    name: "Aaliyah",
    age: 27,
    city: "Toronto",
    bio: "Practicing, hafidha, looking for serious deen-first marriage. Wali involved.",
    avatar: img("1544005313-94ddf0286df2", 400, 400),
    cover: img("1521119989659-a83eee488004", 800, 1100),
    gender: "female",
    modes: ["matrimonial"],
    verified: true,
    walied: true,
  },
  {
    id: "p2",
    name: "Maryam",
    age: 32,
    city: "London",
    bio: "Mom of two — looking for halal playgroups & sisters nearby.",
    avatar: img("1438761681033-6461ffad8d80", 400, 400),
    cover: img("1503454537195-1dcabb73ffb9", 800, 1100),
    gender: "female",
    modes: ["sisterhood"],
    verified: true,
    kidsAges: ["3-5", "6-8"],
  },
  {
    id: "p3",
    name: "Yusuf",
    age: 35,
    city: "Brooklyn",
    bio: "Dad of three. Football Saturdays, Qur'an Sundays. Looking for solid brothers.",
    avatar: img("1492562080023-ab3db95bfbce", 400, 400),
    cover: img("1500648767791-00dcc994a43e", 800, 1100),
    gender: "male",
    modes: ["brotherhood"],
    verified: true,
    kidsAges: ["0-2", "3-5", "9-12"],
  },
  {
    id: "p4",
    name: "Ibrahim",
    age: 29,
    city: "Birmingham",
    bio: "Engineer, hafidh-in-progress. Seeking marriage, modesty-first.",
    avatar: img("1527980965255-d3b416303d12", 400, 400),
    cover: img("1488161628813-04466f872be2", 800, 1100),
    gender: "male",
    modes: ["matrimonial"],
    verified: true,
  },
  {
    id: "p5",
    name: "Khadija",
    age: 30,
    city: "Dubai",
    bio: "New mom, homeschooling enthusiast. Coffee + tafsir circles.",
    avatar: img("1508214751196-bcfd4ca60f91", 400, 400),
    cover: img("1531123897727-8f129e1688ce", 800, 1100),
    gender: "female",
    modes: ["sisterhood"],
    verified: true,
    kidsAges: ["0-2"],
  },
  {
    id: "p6",
    name: "Hamza",
    age: 38,
    city: "Sydney",
    bio: "Dad of one. Building a halal home — in shaa Allah more brothers around.",
    avatar: img("1500648767791-00dcc994a43e", 400, 400),
    cover: img("1502323777036-f29e3972d82f", 800, 1100),
    gender: "male",
    modes: ["brotherhood"],
    verified: false,
    kidsAges: ["0-2"],
  },
  {
    id: "wali-1",
    name: "Br. Omar (Wali)",
    age: 58,
    city: "Toronto",
    bio: "Father of Aaliyah",
    avatar: img("1507003211169-0a1dd7228f2d", 400, 400),
    cover: img("1502323777036-f29e3972d82f", 800, 1100),
    gender: "male",
    modes: ["matrimonial"],
    verified: true,
    isWali: true,
  },
];

export const FEED: FeedPost[] = [
  {
    id: "f1",
    authorId: "p2",
    image: img("1503454537195-1dcabb73ffb9", 1000, 1000),
    caption: "Sister meet-up at the park, alhamdulillah ☕️🌳",
    likes: 124,
    comments: 18,
    timeAgo: "2h",
    mode: "sisterhood",
  },
  {
    id: "f2",
    authorId: "p3",
    image: img("1500648767791-00dcc994a43e", 1000, 1000),
    caption: "Fajr halaqa with the brothers. Make it a habit.",
    likes: 312,
    comments: 41,
    timeAgo: "5h",
    mode: "brotherhood",
  },
  {
    id: "f3",
    authorId: "p1",
    image: img("1521119989659-a83eee488004", 1000, 1000),
    caption: "Reflecting on Surah Al-Mulk this morning 🌿",
    likes: 89,
    comments: 12,
    timeAgo: "1d",
    mode: "matrimonial",
  },
  {
    id: "f4",
    authorId: "p5",
    image: img("1531123897727-8f129e1688ce", 1000, 1000),
    caption: "Homeschool win — first 3 surahs memorized 💚",
    likes: 201,
    comments: 33,
    timeAgo: "1d",
    mode: "sisterhood",
  },
];

export const THREADS: Thread[] = [
  {
    id: "t1",
    kind: "group",
    mode: "matrimonial",
    title: "Aaliyah · Wali present",
    members: ["p1", "wali-1"],
    hasWali: true,
    lastMessage: "Br. Omar joined the conversation.",
    timeAgo: "3m",
    unread: 2,
    online: true,
  },
  { id: "t2", kind: "dm", personId: "p2", mode: "sisterhood", lastMessage: "Saturday playdate confirmed 🎈", timeAgo: "1h", unread: 0, online: true },
  { id: "t3", kind: "dm", personId: "p3", mode: "brotherhood", lastMessage: "Brothers' BBQ this Sunday — count me in", timeAgo: "4h", unread: 1, online: false },
  { id: "t4", kind: "dm", personId: "p4", mode: "matrimonial", lastMessage: "JazākAllāh khair for the reminder.", timeAgo: "1d", unread: 0, online: false },
];

export const MESSAGES: Record<string, Message[]> = {
  t1: [
    { id: "m1", threadId: "t1", fromMe: false, fromId: "p1", text: "As-salāmu ʿalaykum 🌷", time: "10:02" },
    { id: "m2", threadId: "t1", fromMe: true, text: "Wa ʿalaykum as-salām. JazākAllāh for connecting.", time: "10:04" },
    { id: "m3", threadId: "t1", fromMe: false, fromId: "p1", text: "I'm adding my wali to this chat, in shaa Allah.", time: "10:05" },
    { id: "m4", threadId: "t1", system: true, fromMe: false, text: "Br. Omar (Wali) joined the conversation.", time: "10:05" },
    { id: "m5", threadId: "t1", fromMe: false, fromId: "wali-1", text: "As-salāmu ʿalaykum. Pleased to make your acquaintance.", time: "10:08" },
  ],
  t2: [
    { id: "m1", threadId: "t2", fromMe: false, text: "Park at 11? Bring snacks 🍓", time: "9:14" },
    { id: "m2", threadId: "t2", fromMe: true, text: "In shaa Allah, see you there!", time: "9:20" },
  ],
  t3: [
    { id: "m1", threadId: "t3", fromMe: false, text: "BBQ this Sunday after Asr — bring the kids", time: "Yest" },
  ],
  t4: [
    { id: "m1", threadId: "t4", fromMe: true, text: "Jumuʿah mubārak.", time: "Fri" },
    { id: "m2", threadId: "t4", fromMe: false, text: "JazākAllāh khair for the reminder.", time: "Fri" },
  ],
};

export function personById(id: string) {
  return PEOPLE.find((p) => p.id === id)!;
}

export function threadTitle(t: Thread): string {
  if (t.kind === "group") return t.title ?? "Group";
  return personById(t.personId!).name;
}

export function threadAvatars(t: Thread): string[] {
  if (t.kind === "group") return (t.members ?? []).map((id) => personById(id).avatar);
  return [personById(t.personId!).avatar];
}
