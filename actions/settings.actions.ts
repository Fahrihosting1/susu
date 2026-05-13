'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { createOrUpdateBotSettings, getBotSettings, updateUser, isTokenUsedByOtherActiveBot, createBotActivityLog, createAccountActivity } from '@/lib/github-db'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function saveBotSettingsAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const botToken = formData.get('botToken') as string
  const ownerId = formData.get('ownerId') as string
  const botName = formData.get('botName') as string
  const botPhotoUrl = formData.get('botPhotoUrl') as string
  const isActive = formData.get('isActive') === 'on'

  if (!botToken || !ownerId) {
    return { error: 'Bot Token dan Owner ID harus diisi' }
  }

  // Check if token is already used by another active bot
  if (isActive) {
    const tokenCheck = await isTokenUsedByOtherActiveBot(botToken, session.id)
    if (tokenCheck.used) {
      return { 
        error: `Token bot ini sudah digunakan oleh akun lain (${tokenCheck.ownerName}). Nonaktifkan bot tersebut terlebih dahulu atau gunakan token berbeda.` 
      }
    }
  }

  const settings = await createOrUpdateBotSettings(session.id, {
    botToken,
    ownerId,
    botName: botName || undefined,
    botPhotoUrl: botPhotoUrl || undefined,
    isActive,
  })

  if (!settings) {
    return { error: 'Gagal menyimpan pengaturan bot' }
  }

  // Log bot activation/deactivation
  await createBotActivityLog({
    botToken,
    botName: botName || 'Unnamed Bot',
    userId: session.id,
    userName: session.name || session.email,
    action: isActive ? 'start' : 'error',
    telegramUserId: 'system',
    telegramUsername: 'system',
    message: isActive 
      ? `Bot "${botName || 'Unnamed'}" diaktifkan oleh ${session.name || session.email}`
      : `Bot "${botName || 'Unnamed'}" dinonaktifkan oleh ${session.name || session.email}`,
  })

  // Log account activity
  await createAccountActivity({
    userId: session.id,
    action: isActive ? 'bot_activate' : 'bot_deactivate',
    details: isActive 
      ? `Bot "${botName || 'Unnamed'}" diaktifkan`
      : `Bot "${botName || 'Unnamed'}" dinonaktifkan`,
  })

  revalidatePath('/dashboard/settings', 'max')
  return { success: true }
}

export async function toggleBotStatusAction() {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const currentSettings = await getBotSettings(session.id)
  if (!currentSettings) {
    return { error: 'Pengaturan bot belum dikonfigurasi' }
  }

  const newActiveState = !currentSettings.isActive

  // If trying to activate, check if token is used by another active bot
  if (newActiveState) {
    const tokenCheck = await isTokenUsedByOtherActiveBot(currentSettings.botToken, session.id)
    if (tokenCheck.used) {
      return { 
        error: `Token bot ini sudah aktif di akun lain (${tokenCheck.ownerName}). Nonaktifkan bot tersebut terlebih dahulu.` 
      }
    }
  }

  const settings = await createOrUpdateBotSettings(session.id, {
    ...currentSettings,
    isActive: newActiveState,
  })

  if (!settings) {
    return { error: 'Gagal mengubah status bot' }
  }

  // Log status change
  await createBotActivityLog({
    botToken: currentSettings.botToken,
    botName: currentSettings.botName || 'Unnamed Bot',
    userId: session.id,
    userName: session.name || session.email,
    action: newActiveState ? 'start' : 'error',
    telegramUserId: 'system',
    telegramUsername: 'system',
    message: newActiveState 
      ? `Bot "${currentSettings.botName || 'Unnamed'}" diaktifkan`
      : `Bot "${currentSettings.botName || 'Unnamed'}" dinonaktifkan`,
  })

  revalidatePath('/dashboard/settings', 'max')
  revalidatePath('/dashboard', 'max')
  return { success: true, isActive: settings.isActive }
}

export async function updateProfileAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const profilePhotoUrl = formData.get('profilePhotoUrl') as string

  if (!name || !email) {
    return { error: 'Nama dan email harus diisi' }
  }

  const user = await updateUser(session.id, { 
    name, 
    email,
    profilePhotoUrl: profilePhotoUrl || undefined
  })

  if (!user) {
    return { error: 'Gagal mengupdate profil' }
  }

  // Log profile update
  await createAccountActivity({
    userId: session.id,
    action: 'profile_update',
    details: `Profil diperbarui: ${name}`,
  })

  revalidatePath('/dashboard/profile', 'max')
  return { success: true }
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Semua field harus diisi' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Password baru tidak cocok' }
  }

  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  // Get user with password
  const { getUserById } = await import('@/lib/github-db')
  const user = await getUserById(session.id)
  if (!user) {
    return { error: 'User tidak ditemukan' }
  }

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) {
    return { error: 'Password saat ini salah' }
  }

  const hashedPassword = await hashPassword(newPassword)
  const updatedUser = await updateUser(session.id, { password: hashedPassword })

  if (!updatedUser) {
    return { error: 'Gagal mengubah password' }
  }

  // Log password change
  await createAccountActivity({
    userId: session.id,
    action: 'password_change',
    details: 'Password berhasil diubah',
  })

  return { success: true }
}
