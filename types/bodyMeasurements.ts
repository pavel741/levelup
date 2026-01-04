/**
 * Body Measurements Types
 * Track weight, body fat %, measurements, and progress photos
 */

export interface BodyMeasurement {
  id: string
  userId: string
  date: Date | string
  
  // Weight tracking
  weight?: number // kg
  bodyFatPercentage?: number // %
  muscleMass?: number // kg
  boneMass?: number // kg
  waterPercentage?: number // %
  
  // Body measurements (cm)
  measurements: {
    neck?: number
    chest?: number
    waist?: number
    hips?: number
    leftArm?: number
    rightArm?: number
    leftThigh?: number
    rightThigh?: number
    leftCalf?: number
    rightCalf?: number
  }
  
  // Progress photos
  photos?: {
    front?: string // URL or base64
    side?: string
    back?: string
  }
  
  // Notes
  notes?: string
  
  createdAt: Date | string
  updatedAt: Date | string
}

export interface BodyMeasurementStats {
  currentWeight?: number
  weightChange?: number // kg change from start
  weightChangePercentage?: number // % change
  
  currentBodyFat?: number
  bodyFatChange?: number // % change
  
  measurementsChange: {
    [key: string]: {
      current?: number
      change?: number // cm change
      changePercentage?: number // % change
    }
  }
  
  totalMeasurementsTracked: number
  firstMeasurementDate?: Date | string
  lastMeasurementDate?: Date | string
}

