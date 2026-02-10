// Shared TypeScript types
// Add shared types here as the product evolves.

export interface Product {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Avatar {
  id: string;
  name: string;
  description: string;
  channels: string[];
}

export interface Campaign {
  id: string;
  avatarId: string;
  angle: string;
  channel: string;
  hook: string;
}
