'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { checkPaymentStatus } from '@/actions/qris.actions'

export default function PaymentTrackingPage() {
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)

  // Get from URL params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('orderId')
    if (id) {
      setOrderId(id)
      handleCheckStatus(id)
    }
  }, [])

  const handleCheckStatus = async (id: string) => {
    if (!id.trim()) {
      setError('Masukkan Order ID')
      return
    }

    setLoading(true)
    setError(null)
    setPaymentData(null)

    try {
      // For now, we'll fetch the order and payment info directly
      // In a real app, you'd have a dedicated endpoint for this
      const response = await fetch(`/api/orders/${id}`)
      const orderData = await response.json()

      if (!response.ok || !orderData.success) {
        throw new Error('Order tidak ditemukan')
      }

      const order = orderData.order
      if (order.paymentQrisUrl) {
        setQrImage(order.paymentQrisUrl)
      }

      setPaymentData({
        orderId: order.id,
        productName: order.productName,
        amount: order.totalPrice,
        paymentStatus: order.paymentStatus || 'unpaid',
        status: order.status,
        buyerName: order.buyerName,
        createdAt: order.createdAt,
      })

      // If still pending, check actual status
      if (order.paymentStatus === 'pending' && order.paymentTransactionId) {
        const statusResult = await checkPaymentStatus(id, order.paymentTransactionId)
        if (statusResult.success) {
          setPaymentData((prev: any) => ({
            ...prev,
            paymentStatus: statusResult.paymentStatus,
            status: statusResult.orderStatus,
          }))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      unpaid: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Belum Dibayar' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu Pembayaran' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Terbayar' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Gagal' },
    }

    const config = statusConfig[status] || statusConfig.unpaid
    return (
      <div className={`inline-block px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
        {config.label}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-2">Lacak Pembayaran</h1>
          <p className="text-muted-foreground mb-6">
            Masukkan Order ID Anda untuk melihat status pembayaran
          </p>

          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Masukkan Order ID..."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={() => handleCheckStatus(orderId)}
              disabled={loading}
              className="px-6"
            >
              {loading ? 'Mencari...' : 'Cari'}
            </Button>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {paymentData && (
            <div className="space-y-6">
              {/* Order Details */}
              <div className="border rounded-lg p-4">
                <h2 className="font-semibold text-lg mb-4">Rincian Order</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order ID</p>
                    <p className="font-mono font-semibold">{paymentData.orderId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Produk</p>
                    <p className="font-semibold">{paymentData.productName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nama Pembeli</p>
                    <p className="font-semibold">{paymentData.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tanggal Order</p>
                    <p className="font-semibold">
                      {new Date(paymentData.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h2 className="font-semibold text-lg mb-4">Status Pembayaran</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Total Pembayaran</p>
                    <p className="text-3xl font-bold">
                      Rp {paymentData.amount?.toLocaleString('id-ID') || '0'}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(paymentData.paymentStatus)}
                  </div>
                </div>
              </div>

              {/* QRIS Code */}
              {qrImage && (paymentData.paymentStatus === 'unpaid' || paymentData.paymentStatus === 'pending') && (
                <div className="border rounded-lg p-4 text-center">
                  <h2 className="font-semibold text-lg mb-4">Kode QRIS</h2>
                  <p className="text-muted-foreground text-sm mb-3">
                    Scan kode QRIS di bawah ini untuk melakukan pembayaran
                  </p>
                  <img
                    src={qrImage}
                    alt="QRIS Code"
                    className="w-64 h-64 mx-auto border rounded-lg p-2 bg-white"
                  />
                </div>
              )}

              {/* Status Timeline */}
              <div className="border rounded-lg p-4">
                <h2 className="font-semibold text-lg mb-4">Timeline</h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Order Dibuat</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(paymentData.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex gap-3 ${
                      paymentData.paymentStatus === 'paid' ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                        paymentData.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <p className="font-semibold">Pembayaran Diterima</p>
                      <p className="text-sm text-muted-foreground">
                        {paymentData.paymentStatus === 'paid'
                          ? 'Pembayaran telah diterima'
                          : 'Menunggu pembayaran'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex gap-3 ${
                      paymentData.status === 'processing' ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                        paymentData.status === 'processing' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <p className="font-semibold">Diproses</p>
                      <p className="text-sm text-muted-foreground">
                        {paymentData.status === 'processing'
                          ? 'Order sedang diproses'
                          : 'Menunggu pembayaran diterima'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex gap-3 ${
                      paymentData.status === 'completed' ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                        paymentData.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <p className="font-semibold">Selesai</p>
                      <p className="text-sm text-muted-foreground">
                        {paymentData.status === 'completed'
                          ? 'Order telah selesai'
                          : 'Menunggu order diproses'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  <p className="font-semibold mb-2">Panduan Pembayaran:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>1. Buka aplikasi e-wallet atau banking app Anda</li>
                    <li>2. Pilih fitur &quot;Scan QRIS&quot; atau &quot;Bayar dengan QRIS&quot;</li>
                    <li>3. Scan kode QRIS di atas</li>
                    <li>4. Konfirmasi pembayaran sesuai jumlah yang tertera</li>
                    <li>5. Status akan otomatis terupdate setelah pembayaran berhasil</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </Card>

        {!paymentData && !error && (
          <Card className="p-6 mt-6 text-center">
            <p className="text-muted-foreground">
              Masukkan Order ID untuk melihat detail pembayaran dan kode QRIS
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
