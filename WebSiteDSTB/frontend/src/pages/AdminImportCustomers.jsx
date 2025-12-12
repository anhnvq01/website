import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Api from '../services/api'
import * as XLSX from 'xlsx'

function AdminImportCustomers() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate('/admin')
      return
    }
  }, [token])

  // Hàm làm sạch tên khách (loại bỏ text trong ngoặc)
  const cleanName = (name) => {
    if (!name) return ''
    return name.replace(/\s*\(.*?\)\s*/g, '').trim()
  }

  // Hàm chuẩn hóa số điện thoại (giữ chỉ chữ số và thêm 0 nếu cần)
  const normalizePhone = (phone) => {
    if (!phone) return ''
    let normalized = String(phone).replace(/\D/g, '')
    
    // Nếu chỉ có 9 chữ số (thiếu 0), thêm 0 vào đầu
    if (normalized.length === 9) {
      normalized = '0' + normalized
    }
    // Nếu có 11+ chữ số (country code 84), thay 84 bằng 0
    else if (normalized.length > 10) {
      if (normalized.startsWith('84')) {
        normalized = '0' + normalized.substring(2)
      } else if (normalized.startsWith('884')) {
        normalized = '0' + normalized.substring(3)
      }
    }
    
    return normalized
  }

  // Xử lý khi chọn file
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setError('')
    setFile(selectedFile)
    setPreview([])
    setResult(null)

    // Đọc file Excel (nếu là .xlsx)
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
      return
    }

    try {
      // Read Excel file
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      if (data.length < 2) {
        setError('File Excel phải có ít nhất 1 dòng dữ liệu (+ header)')
        return
      }

      // Xử lý dữ liệu: bỏ header, làm sạch tên, chuẩn hóa SĐT
      const rows = data.slice(1) // Bỏ header
        .filter(row => row[0] && row[1]) // Chỉ lấy hàng có đầy đủ tên và SĐT
        .map(row => ({
          original_name: row[0],
          name: cleanName(row[0]),
          phone: normalizePhone(row[1]),
          owner: 'Quang Tâm' // Mặc định
        }))
        .filter(row => row.name && row.phone) // Lọc hàng không hợp lệ

      if (rows.length === 0) {
        setError('Không tìm thấy dữ liệu hợp lệ trong file')
        return
      }

      setPreview(rows.slice(0, 10)) // Hiển thị 10 hàng đầu
    } catch (err) {
      setError(`Lỗi đọc file: ${err.message}`)
    }
  }

  // Import khách hàng
  const handleImport = async () => {
    if (!file || preview.length === 0) {
      setError('Vui lòng chọn file và xem trước dữ liệu trước')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      const rows = data.slice(1)
        .filter(row => row[0] && row[1])
        .map(row => ({
          name: cleanName(row[0]),
          phone: normalizePhone(row[1]),
          owner: 'Quang Tâm'
        }))
        .filter(row => row.name && row.phone)

      const results = { success: 0, error: 0, errors: [] }

      for (let i = 0; i < rows.length; i++) {
        try {
          await Api.adminCreateCustomer(token, rows[i])
          results.success++
        } catch (err) {
          results.error++
          results.errors.push({
            name: rows[i].name,
            phone: rows[i].phone,
            message: err.response?.data?.error || err.message
          })
        }
      }

      setLoading(false)
      setResult(results)
    } catch (err) {
      setLoading(false)
      setError(`Lỗi đọc file: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Admin / Khách hàng</p>
            <h1 className="text-2xl font-bold text-gray-800">Import khách hàng từ Excel</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/admin/customers')} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">← Quay về</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Upload section */}
        <section className="bg-white shadow rounded p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">1️⃣ Chọn file Excel</h2>
          <div className="border-2 border-dashed border-blue-300 rounded p-8 text-center">
            <p className="text-gray-600 mb-4">
              File Excel phải có 2 cột: <strong>Tên khách</strong> và <strong>Số điện thoại</strong>
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-2">Hỗ trợ: .xlsx, .xls</p>
          </div>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </section>

        {/* Preview section */}
        {preview.length > 0 && (
          <section className="bg-white shadow rounded p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">2️⃣ Xem trước dữ liệu sạch ({preview.length} / ...</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-3 py-2">Tên gốc</th>
                    <th className="px-3 py-2">Tên sạch</th>
                    <th className="px-3 py-2">SĐT</th>
                    <th className="px-3 py-2">Thuộc</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">{row.original_name}</td>
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2">{row.phone}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                          {row.owner}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleImport}
                disabled={loading}
                className={`px-6 py-2 rounded text-white font-medium ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Đang import...' : '🚀 Import'}
              </button>
              <button
                onClick={() => { setFile(null); setPreview([]); setResult(null) }}
                className="px-6 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Chọn file khác
              </button>
            </div>
          </section>
        )}

        {/* Result section */}
        {result && (
          <section className="bg-white shadow rounded p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">3️⃣ Kết quả Import</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="text-sm text-green-600 font-medium">✓ Thành công</div>
                <div className="text-3xl font-bold text-green-700">{result.success}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <div className="text-sm text-red-600 font-medium">✗ Lỗi</div>
                <div className="text-3xl font-bold text-red-700">{result.error}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="text-sm text-blue-600 font-medium">📝 Tổng</div>
                <div className="text-3xl font-bold text-blue-700">{result.success + result.error}</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-semibold text-red-700 mb-3">Lỗi chi tiết:</h3>
                <div className="space-y-2">
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      <strong>{err.name}</strong> ({err.phone}): {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { setFile(null); setPreview([]); setResult(null) }}
              className="mt-4 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Import thêm file khác
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminImportCustomers
