'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { AdminStats, AdminUser, AdminGame } from '@/actions/admin'
import type { Item, Winner } from '@/types/database'
import { updateUserCredits, toggleUserAdmin, updateShippingStatus } from '@/actions/admin'

interface AdminDashboardProps {
  stats: AdminStats
  users: AdminUser[]
  games: AdminGame[]
  items: Item[]
  winners: Winner[]
}

type Tab = 'overview' | 'users' | 'games' | 'items' | 'winners'

export function AdminDashboard({ stats, users, games, items, winners }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <ChartIcon /> },
    { id: 'users', label: 'Utilisateurs', icon: <UsersIcon /> },
    { id: 'games', label: 'Parties', icon: <GameIcon /> },
    { id: 'items', label: 'Lots', icon: <GiftIcon /> },
    { id: 'winners', label: 'Gagnants', icon: <TrophyIcon /> },
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-neon-pink/8 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
            <p className="text-white/50 text-sm">Gestion de la plateforme CLIKZY</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && <UsersTab users={users} />}
          {activeTab === 'games' && <GamesTab games={games} />}
          {activeTab === 'items' && <ItemsTab items={items} />}
          {activeTab === 'winners' && <WinnersTab winners={winners} />}
        </motion.div>
      </main>
    </div>
  )
}

// Overview Tab
function OverviewTab({ stats }: { stats: AdminStats }) {
  const statCards = [
    { label: 'Utilisateurs', value: stats.totalUsers, icon: <UsersIcon />, color: 'text-neon-purple' },
    { label: 'Parties totales', value: stats.totalGames, icon: <GameIcon />, color: 'text-neon-pink' },
    { label: 'Parties actives', value: stats.activeGames, icon: <PlayIcon />, color: 'text-success' },
    { label: 'Lots', value: stats.totalItems, icon: <GiftIcon />, color: 'text-warning' },
    { label: 'Gagnants', value: stats.totalWins, icon: <TrophyIcon />, color: 'text-success' },
    { label: 'Clics totaux', value: stats.totalClicks.toLocaleString(), icon: <ClickIcon />, color: 'text-neon-blue' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-4 rounded-xl bg-bg-secondary/50 border border-white/10"
        >
          <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3 ${stat.color}`}>
            {stat.icon}
          </div>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-white/40 text-xs">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

// Users Tab
function UsersTab({ users }: { users: AdminUser[] }) {
  const [editingCredits, setEditingCredits] = useState<string | null>(null)
  const [creditsValue, setCreditsValue] = useState<number>(0)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpdateCredits(userId: string) {
    setLoading(userId)
    await updateUserCredits(userId, creditsValue)
    setEditingCredits(null)
    setLoading(null)
  }

  async function handleToggleAdmin(userId: string, currentStatus: boolean) {
    setLoading(userId)
    await toggleUserAdmin(userId, !currentStatus)
    setLoading(null)
  }

  return (
    <div className="rounded-xl bg-bg-secondary/50 border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Utilisateur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Crédits</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Victoires</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Clics</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Inscrit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold text-sm">
                      {user.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{user.username}</div>
                      <div className="text-white/40 text-xs truncate max-w-[150px]">{user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingCredits === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={creditsValue}
                        onChange={(e) => setCreditsValue(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 rounded bg-bg-primary border border-white/20 text-white text-sm"
                      />
                      <button
                        onClick={() => handleUpdateCredits(user.id)}
                        disabled={loading === user.id}
                        className="p-1 rounded bg-success text-white"
                      >
                        <CheckIcon />
                      </button>
                      <button
                        onClick={() => setEditingCredits(null)}
                        className="p-1 rounded bg-white/10 text-white/60"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ) : (
                    <span className="text-neon-purple font-bold">{user.credits}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-success font-medium">{user.total_wins}</td>
                <td className="px-4 py-3 text-white/60">{user.total_clicks?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                    disabled={loading === user.id}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      user.is_admin
                        ? 'bg-neon-purple/20 text-neon-purple'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {user.is_admin ? 'Admin' : 'User'}
                  </button>
                </td>
                <td className="px-4 py-3 text-white/40 text-sm">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditingCredits(user.id)
                      setCreditsValue(user.credits)
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <EditIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Games Tab
function GamesTab({ games }: { games: AdminGame[] }) {
  const statusColors: Record<string, string> = {
    waiting: 'bg-white/10 text-white/60',
    active: 'bg-neon-purple/20 text-neon-purple',
    final_phase: 'bg-warning/20 text-warning',
    ended: 'bg-success/20 text-success',
  }

  const statusLabels: Record<string, string> = {
    waiting: 'En attente',
    active: 'Active',
    final_phase: 'Phase finale',
    ended: 'Terminée',
  }

  return (
    <div className="rounded-xl bg-bg-secondary/50 border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Lot</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Clics</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Dernier clic</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Créée</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {games.map((game) => (
              <tr key={game.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/40 text-sm font-mono">{game.id.slice(0, 8)}...</td>
                <td className="px-4 py-3">
                  <span className="text-white font-medium">{game.item?.name || '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[game.status]}`}>
                    {statusLabels[game.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-neon-pink font-bold">{game.total_clicks}</td>
                <td className="px-4 py-3 text-white/60 text-sm">{game.last_click_username || '-'}</td>
                <td className="px-4 py-3 text-white/40 text-sm">
                  {new Date(game.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Items Tab
function ItemsTab({ items }: { items: Item[] }) {
  return (
    <div className="rounded-xl bg-bg-secondary/50 border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Lot</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Valeur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Actif</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-bg-primary overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-white/40 text-xs truncate max-w-[200px]">{item.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-success font-bold">
                  {item.retail_value ? `${item.retail_value}€` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.is_active ? 'bg-success/20 text-success' : 'bg-white/10 text-white/40'
                  }`}>
                    {item.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/40 text-sm">
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Winners Tab
function WinnersTab({ winners }: { winners: Winner[] }) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const statusColors: Record<string, string> = {
    pending: 'bg-white/10 text-white/60',
    address_needed: 'bg-warning/20 text-warning',
    processing: 'bg-neon-purple/20 text-neon-purple',
    shipped: 'bg-neon-blue/20 text-neon-blue',
    delivered: 'bg-success/20 text-success',
  }

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    address_needed: 'Adresse requise',
    processing: 'En préparation',
    shipped: 'Expédié',
    delivered: 'Livré',
  }

  const statusOptions: Array<'pending' | 'address_needed' | 'processing' | 'shipped' | 'delivered'> = [
    'pending', 'address_needed', 'processing', 'shipped', 'delivered'
  ]

  async function handleStatusChange(winnerId: string, newStatus: 'pending' | 'address_needed' | 'processing' | 'shipped' | 'delivered') {
    setUpdatingStatus(winnerId)
    await updateShippingStatus(winnerId, newStatus)
    setUpdatingStatus(null)
  }

  return (
    <div className="rounded-xl bg-bg-secondary/50 border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Gagnant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Lot</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Valeur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Statut livraison</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {winners.map((winner) => (
              <tr key={winner.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{winner.username || 'Anonyme'}</span>
                    {winner.is_bot && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/40">BOT</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-white">{winner.item_name}</td>
                <td className="px-4 py-3 text-success font-bold">
                  {winner.item_value ? `${winner.item_value}€` : '-'}
                </td>
                <td className="px-4 py-3 text-white/40 text-sm">
                  {new Date(winner.won_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={winner.shipping_status}
                    onChange={(e) => handleStatusChange(winner.id, e.target.value as typeof statusOptions[number])}
                    disabled={updatingStatus === winner.id || winner.is_bot}
                    className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${statusColors[winner.shipping_status]} disabled:opacity-50`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{statusLabels[status]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Icons
function ChartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function GameIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    </svg>
  )
}

function ClickIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
