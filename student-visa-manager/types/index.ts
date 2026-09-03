// 学生情報
export interface Student {
  id: string;
  // 基本情報
  name: string;           // 氏名（漢字）
  nameKana: string;       // 氏名（カタカナ）
  nameRomaji: string;     // 氏名（ローマ字）
  studentNumber: string;  // 学籍番号
  grade: number;          // 学年
  className: string;      // クラス

  // 在留カード情報
  residenceCardNumber: string;    // 在留カード番号
  residenceStatus: string;        // 在留資格
  residenceExpiry: string;        // 在留期限 (yyyy-MM-dd)
  renewalHistory: RenewalRecord[]; // 更新履歴

  // 出身・学歴
  nationality: string;           // 出身国
  homeCountryEducation: string;  // 出身国での最終学歴
  japaneseSchoolName: string;    // 日本語学校名
  enrollmentDate: string;        // 入学日

  // アルバイト情報
  partTimeJobs: PartTimeJob[];   // アルバイト先（複数対応）
  workPermitStatus: 'yes' | 'no' | 'pending'; // 資格外活動許可
  workPermitExpiry: string;      // 資格外活動許可の期限

  // メモ
  notes: string;
}

// 在留期限更新履歴
export interface RenewalRecord {
  id: string;
  date: string;           // 更新日
  previousExpiry: string; // 旧期限
  newExpiry: string;      // 新期限
  note: string;           // メモ
}

// アルバイト先
export interface PartTimeJob {
  id: string;
  companyName: string;    // 会社名
  address: string;        // 住所
  industry: string;       // 業種
  weeklyHours: number;    // 週あたり就労時間
  startDate: string;      // 勤務開始日
  isActive: boolean;      // 現在も勤務中か
}

// アプリ設定
export interface Settings {
  schoolName: string;            // 学校名
  schoolAddress: string;         // 学校住所
  alertDaysBefore: number;       // 何日前からアラート表示するか（デフォルト60）
}

// 在留資格の選択肢
export const RESIDENCE_STATUS_OPTIONS = [
  '留学',
  '特定活動',
  '家族滞在',
  'その他',
] as const;

// 主な国籍の選択肢
export const NATIONALITY_OPTIONS = [
  'ベトナム',
  'ネパール',
  '中国',
  'ミャンマー',
  'スリランカ',
  'インドネシア',
  'フィリピン',
  'モンゴル',
  'タイ',
  'バングラデシュ',
  '韓国',
  '台湾',
  'その他',
] as const;

// 最終学歴の選択肢
export const EDUCATION_LEVEL_OPTIONS = [
  '大学院卒',
  '大学卒',
  '短大卒',
  '専門学校卒',
  '高校卒',
  '中学卒',
  'その他',
] as const;

// 業種の選択肢
export const INDUSTRY_OPTIONS = [
  '飲食業',
  'コンビニ',
  '小売業',
  '製造業',
  '清掃業',
  'ホテル・旅館',
  '倉庫・物流',
  '事務',
  'その他',
] as const;

// 在留期限のアラートレベル
export type AlertLevel = 'expired' | 'urgent' | 'warning' | 'safe';

export function getAlertLevel(expiryDate: string, alertDaysBefore: number = 60): AlertLevel {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'urgent';
  if (diffDays <= alertDaysBefore) return 'warning';
  return 'safe';
}
