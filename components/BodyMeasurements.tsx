'use client'

import { useState, useEffect, useMemo } from 'react'
import { getBodyMeasurements, addBodyMeasurement, updateBodyMeasurement, deleteBodyMeasurement } from '@/lib/bodyMeasurementsApi'
import type { BodyMeasurement } from '@/types/bodyMeasurements'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { showError, showSuccess } from '@/lib/utils'

interface BodyMeasurementsProps {
  userId: string
}

export default function BodyMeasurements({ userId }: BodyMeasurementsProps) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null)

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bodyFatPercentage: '',
    muscleMass: '',
    boneMass: '',
    waterPercentage: '',
    neck: '',
    chest: '',
    waist: '',
    hips: '',
    leftArm: '',
    rightArm: '',
    leftThigh: '',
    rightThigh: '',
    leftCalf: '',
    rightCalf: '',
    notes: '',
  })

  useEffect(() => {
    loadMeasurements()
  }, [userId])

  const loadMeasurements = async () => {
    try {
      setIsLoading(true)
      const data = await getBodyMeasurements(userId)
      setMeasurements(data)
    } catch (error) {
      console.error('Error loading body measurements:', error)
      showError(error, { component: 'BodyMeasurements', action: 'loadMeasurements' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        date: new Date(formData.date),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        bodyFatPercentage: formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : undefined,
        muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : undefined,
        boneMass: formData.boneMass ? parseFloat(formData.boneMass) : undefined,
        waterPercentage: formData.waterPercentage ? parseFloat(formData.waterPercentage) : undefined,
        measurements: {
          neck: formData.neck ? parseFloat(formData.neck) : undefined,
          chest: formData.chest ? parseFloat(formData.chest) : undefined,
          waist: formData.waist ? parseFloat(formData.waist) : undefined,
          hips: formData.hips ? parseFloat(formData.hips) : undefined,
          leftArm: formData.leftArm ? parseFloat(formData.leftArm) : undefined,
          rightArm: formData.rightArm ? parseFloat(formData.rightArm) : undefined,
          leftThigh: formData.leftThigh ? parseFloat(formData.leftThigh) : undefined,
          rightThigh: formData.rightThigh ? parseFloat(formData.rightThigh) : undefined,
          leftCalf: formData.leftCalf ? parseFloat(formData.leftCalf) : undefined,
          rightCalf: formData.rightCalf ? parseFloat(formData.rightCalf) : undefined,
        },
        notes: formData.notes.trim() || undefined,
      }

      await addBodyMeasurement(userId, measurement)
      showSuccess('Body measurement added')
      loadMeasurements()
      resetForm()
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding body measurement:', error)
      showError(error, { component: 'BodyMeasurements', action: 'addMeasurement' })
    }
  }

  const handleEdit = (measurement: BodyMeasurement) => {
    setEditingMeasurement(measurement)
    setFormData({
      date: format(new Date(measurement.date), 'yyyy-MM-dd'),
      weight: measurement.weight?.toString() || '',
      bodyFatPercentage: measurement.bodyFatPercentage?.toString() || '',
      muscleMass: measurement.muscleMass?.toString() || '',
      boneMass: measurement.boneMass?.toString() || '',
      waterPercentage: measurement.waterPercentage?.toString() || '',
      neck: measurement.measurements.neck?.toString() || '',
      chest: measurement.measurements.chest?.toString() || '',
      waist: measurement.measurements.waist?.toString() || '',
      hips: measurement.measurements.hips?.toString() || '',
      leftArm: measurement.measurements.leftArm?.toString() || '',
      rightArm: measurement.measurements.rightArm?.toString() || '',
      leftThigh: measurement.measurements.leftThigh?.toString() || '',
      rightThigh: measurement.measurements.rightThigh?.toString() || '',
      leftCalf: measurement.measurements.leftCalf?.toString() || '',
      rightCalf: measurement.measurements.rightCalf?.toString() || '',
      notes: measurement.notes || '',
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editingMeasurement) return

    try {
      const updates: Partial<BodyMeasurement> = {
        date: new Date(formData.date),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        bodyFatPercentage: formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : undefined,
        muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : undefined,
        boneMass: formData.boneMass ? parseFloat(formData.boneMass) : undefined,
        waterPercentage: formData.waterPercentage ? parseFloat(formData.waterPercentage) : undefined,
        measurements: {
          neck: formData.neck ? parseFloat(formData.neck) : undefined,
          chest: formData.chest ? parseFloat(formData.chest) : undefined,
          waist: formData.waist ? parseFloat(formData.waist) : undefined,
          hips: formData.hips ? parseFloat(formData.hips) : undefined,
          leftArm: formData.leftArm ? parseFloat(formData.leftArm) : undefined,
          rightArm: formData.rightArm ? parseFloat(formData.rightArm) : undefined,
          leftThigh: formData.leftThigh ? parseFloat(formData.leftThigh) : undefined,
          rightThigh: formData.rightThigh ? parseFloat(formData.rightThigh) : undefined,
          leftCalf: formData.leftCalf ? parseFloat(formData.leftCalf) : undefined,
          rightCalf: formData.rightCalf ? parseFloat(formData.rightCalf) : undefined,
        },
        notes: formData.notes.trim() || undefined,
      }

      await updateBodyMeasurement(userId, editingMeasurement.id, updates)
      showSuccess('Body measurement updated')
      loadMeasurements()
      resetForm()
      setShowEditModal(false)
      setEditingMeasurement(null)
    } catch (error) {
      console.error('Error updating body measurement:', error)
      showError(error, { component: 'BodyMeasurements', action: 'updateMeasurement' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this measurement?')) return

    try {
      await deleteBodyMeasurement(userId, id)
      showSuccess('Body measurement deleted')
      loadMeasurements()
    } catch (error) {
      console.error('Error deleting body measurement:', error)
      showError(error, { component: 'BodyMeasurements', action: 'deleteMeasurement' })
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: '',
      bodyFatPercentage: '',
      muscleMass: '',
      boneMass: '',
      waterPercentage: '',
      neck: '',
      chest: '',
      waist: '',
      hips: '',
      leftArm: '',
      rightArm: '',
      leftThigh: '',
      rightThigh: '',
      leftCalf: '',
      rightCalf: '',
      notes: '',
    })
  }

  // Calculate stats
  const stats = useMemo(() => {
    if (measurements.length === 0) return null

    const sorted = [...measurements].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    return {
      weightChange: last.weight && first.weight ? last.weight - first.weight : undefined,
      weightChangePercentage: last.weight && first.weight
        ? ((last.weight - first.weight) / first.weight) * 100
        : undefined,
      bodyFatChange: last.bodyFatPercentage && first.bodyFatPercentage
        ? last.bodyFatPercentage - first.bodyFatPercentage
        : undefined,
      firstDate: first.date,
      lastDate: last.date,
      totalMeasurements: measurements.length,
    }
  }, [measurements])

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading body measurements...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Body Measurements</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your weight, body fat %, and measurements over time
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Measurement
        </button>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Weight Change</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.weightChange !== undefined && (
                <span className={stats.weightChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {stats.weightChange >= 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg
                </span>
              )}
              {stats.weightChange === undefined && '-'}
            </div>
            {stats.weightChangePercentage !== undefined && (
              <div className="text-xs text-gray-500 mt-1">
                {stats.weightChangePercentage >= 0 ? '+' : ''}{stats.weightChangePercentage.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Body Fat Change</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.bodyFatChange !== undefined && (
                <span className={stats.bodyFatChange <= 0 ? 'text-green-600' : 'text-red-600'}>
                  {stats.bodyFatChange >= 0 ? '+' : ''}{stats.bodyFatChange.toFixed(1)}%
                </span>
              )}
              {stats.bodyFatChange === undefined && '-'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Measurements</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalMeasurements}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.firstDate && format(new Date(stats.firstDate), 'MMM d, yyyy')} - {stats.lastDate && format(new Date(stats.lastDate), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      )}

      {/* Measurements List */}
      <div className="space-y-4">
        {measurements.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No measurements yet. Add your first measurement to start tracking!</p>
          </div>
        ) : (
          measurements.map((measurement) => (
            <div
              key={measurement.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {format(new Date(measurement.date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(measurement)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(measurement.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {measurement.weight !== undefined && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Weight</div>
                    <div className="font-medium text-gray-900 dark:text-white">{measurement.weight} kg</div>
                  </div>
                )}
                {measurement.bodyFatPercentage !== undefined && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Body Fat</div>
                    <div className="font-medium text-gray-900 dark:text-white">{measurement.bodyFatPercentage}%</div>
                  </div>
                )}
                {measurement.muscleMass !== undefined && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Muscle Mass</div>
                    <div className="font-medium text-gray-900 dark:text-white">{measurement.muscleMass} kg</div>
                  </div>
                )}
                {measurement.waterPercentage !== undefined && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Water</div>
                    <div className="font-medium text-gray-900 dark:text-white">{measurement.waterPercentage}%</div>
                  </div>
                )}
                {measurement.measurements.chest && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Chest</div>
                    <div className="font-medium text-gray-900 dark:text-white">{measurement.measurements.chest} cm</div>
                  </div>
                )}
                {measurement.measurements.waist && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Waist</div>
                    <div className="font-medium text-gray-900 dark:text-white">{measurement.measurements.waist} cm</div>
                  </div>
                )}
                {measurement.measurements.hips && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Hips</div>
                    <div className="font-medium text-gray-900 dark:text-white">{measurement.measurements.hips} cm</div>
                  </div>
                )}
                {measurement.measurements.leftArm && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Left Arm</div>
                    <div className="font-medium text-gray-900 dark:text-white">{measurement.measurements.leftArm} cm</div>
                  </div>
                )}
              </div>

              {measurement.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{measurement.notes}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <MeasurementModal
          formData={formData}
          setFormData={setFormData}
          onSave={handleAdd}
          onClose={() => {
            setShowAddModal(false)
            resetForm()
          }}
          title="Add Body Measurement"
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingMeasurement && (
        <MeasurementModal
          formData={formData}
          setFormData={setFormData}
          onSave={handleUpdate}
          onClose={() => {
            setShowEditModal(false)
            setEditingMeasurement(null)
            resetForm()
          }}
          title="Edit Body Measurement"
        />
      )}
    </div>
  )
}

interface MeasurementModalProps {
  formData: any
  setFormData: (data: any) => void
  onSave: () => void
  onClose: () => void
  title: string
}

function MeasurementModal({ formData, setFormData, onSave, onClose, title }: MeasurementModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          {/* Weight & Body Composition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="70.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body Fat %</label>
              <input
                type="number"
                step="0.1"
                value={formData.bodyFatPercentage}
                onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="15.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Muscle Mass (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.muscleMass}
                onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="55.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Water %</label>
              <input
                type="number"
                step="0.1"
                value={formData.waterPercentage}
                onChange={(e) => setFormData({ ...formData, waterPercentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="60.0"
              />
            </div>
          </div>

          {/* Body Measurements */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Body Measurements (cm)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Neck</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.neck}
                  onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chest</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.chest}
                  onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Waist</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.waist}
                  onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hips</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.hips}
                  onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Left Arm</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.leftArm}
                  onChange={(e) => setFormData({ ...formData, leftArm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Right Arm</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.rightArm}
                  onChange={(e) => setFormData({ ...formData, rightArm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Left Thigh</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.leftThigh}
                  onChange={(e) => setFormData({ ...formData, leftThigh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Right Thigh</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.rightThigh}
                  onChange={(e) => setFormData({ ...formData, rightThigh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Left Calf</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.leftCalf}
                  onChange={(e) => setFormData({ ...formData, leftCalf: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Right Calf</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.rightCalf}
                  onChange={(e) => setFormData({ ...formData, rightCalf: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

