export enum PageType {
  PRIVATE = 'private',
  PUBLIC = 'public',
  STORY = 'story',
  RECOMMEND = 'recommend',
  BURIAL = 'burial',
  ANY = 'any',
}

export enum AlertType {
  PUBLIC = 'public',
  LINKEDOUT = 'linkedout',
  SUPPORT = 'support',
}

export enum AppType {
  ANDROID_MOBILE = 'android_mobile',
  ANDROID_TABLET = 'android_tablet',
  IOS_MOBILE = 'ios_mobile',
  IOS_TABLET = 'ios_tablet',
  DESKTOP_MAC = 'desktop_mac',
  DESKTOP_WINDOWS = 'desktop_windows',
}

export enum DeviceOS {
  WINDOW = 'Window',
  MAC = 'Mac',
  ANDROID = 'Android',
  IOS = 'iOS',
  LINUX = 'Linux',
  UNKNOWN = 'Unknown',
}

export enum DeviceType {
  DESKTOP = 'Desktop',
  LAPTOP = 'Laptop',
  MOBILE = 'Mobile',
  TABLET = 'Tablet',
  UNKNOWN = 'Unknown',
}

export enum EssayStatus {
  PRIVATE = 'private',
  PUBLISHED = 'published',
  PUBLIC = 'public',
  LINKEDOUT = 'linkedout',
  BURIAL = 'burial',
}

export enum ActionType {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending',
  UPDATED = 'updated',
  DELETED = 'deleted',
  UNPUBLIC = 'unpublic',
  UNLINKEDOUT = 'unlinkedout',
  PUBLIC = 'public',
  LINKEDOUT = 'linkedout',
  BANNED = 'banned',
  MONITORED = 'monitored',
  ANSWERED = 'answered',
}

export enum ReviewQueueType {
  LINKEDOUT = 'linkedout',
  PUBLIC = 'public',
  BURIAL = 'burial',
}

export enum ServerStatus {
  OPEN = 'open',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
}

export enum UserStatus {
  ACTIVATED = 'activated',
  MONITORED = 'monitored',
  BANNED = 'banned',
  DEACTIVATED = 'deactivated',
}
