import { supabase } from './supabase';

export const FREE_DOWNLOAD_LIMIT = 3;
const ADMIN_ITEMS_PER_PAGE = 1000; // 🔐 FIX #11: Add pagination limit

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

export interface Photo {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
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
  totalPhotos: number;
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
    const { data: vid } = await supabase.from('videos').select('views').eq('id', videoId).single();
    if (vid) {
      await supabase.from('videos').update({ views: (vid.views || 0) + 1 }).eq('id', videoId);
    }
  } catch (err) {
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

function toPublicPhoto(p: any): Photo {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    imageUrl: p.image_url,
    category: p.category,
    views: p.views || 0,
    isVip: p.is_vip,
    published: p.published,
    createdAt: p.created_at,
  };
}

// Photos Public functions
export async function getPhotos(options?: { category?: string }): Promise<Photo[]> {
  let query = supabase.from('photos').select('*').eq('published', true).order('created_at', { ascending: false }).limit(100);
  if (options?.category) {
    query = query.eq('category', options.category);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toPublicPhoto);
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
    const { count: photoCount } = await supabase.from('photos').select('*', { count: 'exact', head: true });
    
    const { data: videoViews } = await supabase.from('videos').select('views');
    const { data: photoViews } = await supabase.from('photos').select('views');
    
    const { count: downloadCount } = await supabase.from('downloads').select('*', { count: 'exact', head: true });
    const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');

    const totalVideoViews = (videoViews || []).reduce((sum: number, v: any) => sum + (v.views || 0), 0);
    const totalPhotoViews = (photoViews || []).reduce((sum: number, p: any) => sum + (p.views || 0), 0);

    return {
      totalUsers: userCount ?? 0,
      activeVip: vipCount ?? 0,
      totalVideos: videoCount ?? 0,
      totalPhotos: photoCount ?? 0,
      totalViews: totalVideoViews + totalPhotoViews,
      totalDownloads: downloadCount ?? 0,
      openTickets: ticketCount ?? 0,
    };
  } catch (err) {
    console.error('Failed to fetch admin stats:', err);
    return {
      totalUsers: 0,
      activeVip: 0,
      totalVideos: 0,
      totalPhotos: 0,
      totalViews: 0,
      totalDownloads: 0,
      openTickets: 0,
    };
  }
}

export async function adminListVideos(page: number = 1): Promise<Video[]> {
  const offset = (page - 1) * ADMIN_ITEMS_PER_PAGE;
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + ADMIN_ITEMS_PER_PAGE - 1);
  if (error) throw error;
  return (data || []).map(toPublicVideo);
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
  const { error } = await supabase
    .from('videos')
    .update({ published: false })
    .eq('id', id);
  if (error) throw error;
}

// 🔐 Admin Photos CRUD
export async function adminListPhotos(page: number = 1): Promise<Photo[]> {
  const offset = (page - 1) * ADMIN_ITEMS_PER_PAGE;
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + ADMIN_ITEMS_PER_PAGE - 1);
  if (error) throw error;
  return (data || []).map(toPublicPhoto);
}

export async function adminCreatePhoto(photo: Omit<Photo, 'id' | 'createdAt' | 'views'>) {
  const { error } = await supabase.from('photos').insert({
    title: photo.title.substring(0, 255),
    description: photo.description,
    image_url: photo.imageUrl,
    category: photo.category,
    is_vip: photo.isVip,
    published: photo.published,
    views: 0,
  });
  if (error) throw error;
}

export async function adminDeletePhoto(id: string) {
  const { error } = await supabase
    .from('photos')
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

export async function confirmAge(userId: string) {
  const { error } = await supabase.from('users').update({ age_confirmed: true }).eq('id', userId);
  if (error) throw error;
}

export async function getBannerVideo(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', 'home_banner_video')
      .single();
    if (error || !data) return '';
    return data.value;
  } catch (err) {
    console.error('Erreur getBannerVideo:', err);
    return '';
  }
}

export async function updateBannerVideo(url: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ id: 'home_banner_video', value: url.trim(), updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erreur updateBannerVideo:', err);
    throw err;
  }
}
// ====================================================
//  FONCTIONS DE GESTION DU LIVE
// ====================================================

export interface LiveState {
  isActive: boolean;
  streamUrl: string | null;
}

export async function getLiveStatus(): Promise<LiveState> {
  try {
    const { data, error } = await supabase
      .from('live_status')
      .select('is_active, stream_url')
      .eq('id', 1)
      .single();
    if (error || !data) return { isActive: false, streamUrl: null };
    return { isActive: data.is_active, streamUrl: data.stream_url };
  } catch {
    return { isActive: false, streamUrl: null };
  }
}

export async function updateLiveStatus(isActive: boolean, streamUrl: string | null): Promise<boolean> {
  const { error } = await supabase
    .from('live_status')
    .update({
      is_active: isActive,
      stream_url: isActive ? streamUrl : null,
      started_at: isActive ? new Date().toISOString() : null
    })
    .eq('id', 1);
  if (error) throw error;
  return true;
}

// ====================================================
//  FONCTIONS DE GESTION DU SYSTÈME VIP
// ====================================================

export interface VipRequest {
  id: string;
  userId: string;
  userEmail: string;
  paymentMethod: 'moncash' | 'natcash';
  proofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Lister toutes les demandes VIP (avec pagination optionnelle)
export async function adminListVipRequests(page: number = 1): Promise<VipRequest[]> {
  const offset = (page - 1) * ADMIN_ITEMS_PER_PAGE;
  const { data, error } = await supabase
    .from('vip_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + ADMIN_ITEMS_PER_PAGE - 1);
  
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    userEmail: r.user_email,
    paymentMethod: r.payment_method,
    proofUrl: r.proof_url,
    status: r.status,
    createdAt: r.created_at,
  }));
}

// Valider une demande VIP et mettre à jour le rôle de l'utilisateur
export async function adminProcessVipRequest(
  requestId: string, 
  userId: string, 
  action: 'approved' | 'rejected', 
  daysDuration: number = 30
) {
  // 1. Mise à jour du statut de la requête
  const { error: requestError } = await supabase
    .from('vip_requests')
    .update({ status: action })
    .eq('id', requestId);

  if (requestError) throw requestError;

  // 2. Si approuvé, on passe l'utilisateur en plan VIP avec une date de fin
  if (action === 'approved') {
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + daysDuration);

    const { error: userError } = await supabase
      .from('users')
      .update({
        plan: 'vip',
        subscription_ends_at: subscriptionEndsAt.toISOString()
      })
      .eq('id', userId);

    if (userError) throw userError;
  }
}
