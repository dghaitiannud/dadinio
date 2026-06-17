import { supabase } from './supabase';

export const FREE_DOWNLOAD_LIMIT = 3;
const ADMIN_ITEMS_PER_PAGE = 20; // 🔐 FIX #11: Add pagination limit

// Types
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: string;
  durationSec: number;
  views: number;
  isVip: boolean;
  published: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  body: string;
  anonymous: boolean;
  displayName: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  reply: string | null;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  plan: string;
  blocked: boolean;
  isAdmin: boolean;
  ageConfirmed: boolean;
  createdAt: string;
  subscriptionEndsAt: string | null;
}

export interface AdminStats {
  totalUsers: number;
  activeVip: number;
  totalVideos: number;
  totalViews: number;
  totalDownloads: number;
  openTickets: number;
}

// Videos
export async function getVideos(options?: { q?: string; category?: string }): Promise<Video[]> {
  let query = supabase.from('videos').select('*').eq('published', true).order('created_at', { ascending: false }).limit(100);

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.q) {
    query = query.or(`title.ilike.%${options.q}%,description.ilike.%${options.q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toPublicVideo);
}

export async function getTrendingVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('published', true)
    .order('views', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data || []).map(toPublicVideo);
}

export async function getVideo(id: string): Promise<Video | null> {
  const { data, error } = await supabase.from('videos').select('*').eq('id', id).single();
  if (error) return null;
  return toPublicVideo(data);
}

export async function registerView(videoId: string, userId?: string) {
  try {
    await supabase.from('views').insert({ video_id: videoId, user_id: userId || null });
    // increment views count
    const { data: vid } = await supabase.from('videos').select('views').eq('id', videoId).single();
    if (vid) {
      await supabase.from('videos').update({ views: (vid.views || 0) + 1 }).eq('id', videoId);
    }
  } catch (err) {
    // 🔐 FIX #9: Graceful error handling - view tracking is not critical
    console.warn('Failed to register view:', err);
  }
}

export async function requestDownload(
  videoId: string,
  userId: string,
  isVip: boolean,
  freeDownloadsUsed: number
): Promise<{ url: string; remaining: number }> {
  const { data: video } = await supabase.from('videos').select('*').eq('id', videoId).single();
  if (!video) throw new Error('Video not found');
  if (video.is_vip && !isVip) {
    throw new Error('vip_required');
  }
  if (!isVip && freeDownloadsUsed >= FREE_DOWNLOAD_LIMIT) {
    throw new Error('quota_exceeded');
  }
  if (!isVip) {
    await supabase.from('users').update({ free_downloads_used: freeDownloadsUsed + 1 }).eq('id', userId);
  }
  await supabase.from('downloads').insert({ user_id: userId, video_id: videoId });
  const remaining = isVip ? -1 : FREE_DOWNLOAD_LIMIT - (freeDownloadsUsed + 1);
  return { url: video.video_url, remaining };
}

function toPublicVideo(v: any): Video {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnail_url,
    videoUrl: v.video_url,
    category: v.category,
    durationSec: v.duration_sec,
    views: v.views || 0,
    isVip: v.is_vip,
    published: v.published,
    createdAt: v.created_at,
  };
}

// Comments
export async function listComments(videoId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id,
    videoId: c.video_id,
    userId: c.user_id,
    body: c.body,
    anonymous: c.anonymous,
    displayName: c.display_name || 'Utilisateur',
    createdAt: c.created_at,
  }));
}

// 🔐 FIX #19: Add max-length validation for comments
export async function createComment(
  videoId: string,
  userId: string,
  body: string,
  anonymous: boolean,
  displayName: string
) {
  const maxLength = 500;
  if (body.length > maxLength) {
    throw new Error(`Comment cannot exceed ${maxLength} characters`);
  }
  const { error } = await supabase.from('comments').insert({
    video_id: videoId,
    user_id: userId,
    body: body.trim(),
    anonymous,
    display_name: (displayName || 'Utilisateur').substring(0, 100),
  });
  if (error) throw error;
}

// Tickets
export async function listMyTickets(userId: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    subject: t.subject,
    message: t.message,
    reply: t.reply,
    status: t.status,
    createdAt: t.created_at,
  }));
}

export async function createTicket(userId: string, subject: string, message: string) {
  const { error } = await supabase.from('tickets').insert({
    user_id: userId,
    subject: subject.substring(0, 200),
    message: message.substring(0, 2000),
    status: 'open',
  });
  if (error) throw error;
}

// Admin
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: vipCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'vip')
      .gt('subscription_ends_at', new Date().toISOString());
    const { count: videoCount } = await supabase.from('videos').select('*', { count: 'exact', head: true });
    const { data: views } = await supabase.from('videos').select('views');
    const { count: downloadCount } = await supabase.from('downloads').select('*', { count: 'exact', head: true });
    const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');

    const totalViews = (views || []).reduce((sum: number, v: any) => sum + (v.views || 0), 0);

    return {
      totalUsers: userCount ?? 0,
      activeVip: vipCount ?? 0,
      totalVideos: videoCount ?? 0,
      totalViews,
      totalDownloads: downloadCount ?? 0,
      openTickets: ticketCount ?? 0,
    };
  } catch (err) {
    console.error('Failed to fetch admin stats:', err);
    return {
      totalUsers: 0,
      activeVip: 0,
      totalVideos: 0,
      totalViews: 0,
      totalDownloads: 0,
      openTickets: 0,
    };
  }
}

// 🔐 FIX #11: Add pagination to adminListVideos
export async function adminListVideos(page: number = 1): Promise<Video[]> {
  const offset = (page - 1) * ADMIN_ITEMS_PER_PAGE;
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + ADMIN_ITEMS_PER_PAGE - 1);
  if (error) throw error;
  return (data || []).map((v: any) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnail_url,
    videoUrl: v.video_url,
    category: v.category,
    durationSec: v.duration_sec,
    views: v.views || 0,
    isVip: v.is_vip,
    published: v.published,
    createdAt: v.created_at,
  }));
}

export async function adminCreateVideo(video: Omit<Video, 'id' | 'createdAt' | 'views'>) {
  const { error } = await supabase.from('videos').insert({
    title: video.title.substring(0, 255),
    description: video.description,
    thumbnail_url: video.thumbnailUrl,
    video_url: video.videoUrl,
    category: video.category,
    duration_sec: video.durationSec,
    is_vip: video.isVip,
    published: video.published,
    views: 0,
  });
  if (error) throw error;
}

export async function adminDeleteVideo(id: string) {
  // 🔐 FIX #17: Soft-delete - mark as unpublished instead of deleting
  const { error } = await supabase
    .from('videos')
    .update({ published: false })
    .eq('id', id);
  if (error) throw error;
}

export async function adminListUsers(page: number = 1): Promise<AdminUser[]> {
  const offset = (page - 1) * ADMIN_ITEMS_PER_PAGE;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + ADMIN_ITEMS_PER_PAGE - 1);
  if (error) throw error;
  return (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    plan: u.plan,
    blocked: u.blocked,
    isAdmin: u.is_admin,
    ageConfirmed: u.age_confirmed,
    createdAt: u.created_at,
    subscriptionEndsAt: u.subscription_ends_at,
  }));
}

// 🔐 FIX #12: Prevent admin from blocking themselves
export async function adminBlockUser(currentUserId: string, targetUserId: string, blocked: boolean) {
  if (currentUserId === targetUserId) {
    throw new Error('Cannot block yourself');
  }
  const { error } = await supabase.from('users').update({ blocked }).eq('id', targetUserId);
  if (error) throw error;
}

export async function adminListTickets(page: number = 1): Promise<SupportTicket[]> {
  const offset = (page - 1) * ADMIN_ITEMS_PER_PAGE;
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + ADMIN_ITEMS_PER_PAGE - 1);
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    subject: t.subject,
    message: t.message,
    reply: t.reply,
    status: t.status,
    createdAt: t.created_at,
  }));
}

export async function adminReplyTicket(id: string, reply: string) {
  const { error } = await supabase.from('tickets').update({ reply: reply.substring(0, 2000), status: 'answered' }).eq('id', id);
  if (error) throw error;
}

// Confirm age
export async function confirmAge(userId: string) {
  const { error } = await supabase.from('users').update({ age_confirmed: true }).eq('id', userId);
  if (error) throw error;
}
