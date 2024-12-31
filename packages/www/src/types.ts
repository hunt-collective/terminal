export type State =
  | 'normal'
  | 'active'
  | 'success'
  | 'error'
  | 'busy'
  | 'warning'

export type NavPage = { href: string; text: string; active?: boolean }
export type NavLink = { group: string; pages: NavPage[] }
