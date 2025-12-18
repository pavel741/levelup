/**
 * Validates if a missed habit reason is valid or invalid
 * Valid reasons: sickness, emergencies, medical issues, etc.
 * Invalid reasons: hangover, laziness, lack of motivation, etc.
 */

export interface ValidationResult {
  valid: boolean
  category: 'valid' | 'invalid' | 'neutral'
  message?: string
}

const VALID_KEYWORDS = [
  'sick', 'illness', 'ill', 'flu', 'fever', 'cold', 'covid', 'coronavirus',
  'hospital', 'emergency', 'family emergency', 'death', 'funeral', 'accident',
  'injury', 'injured', 'broken', 'fracture', 'sprain', 'doctor', 'medical',
  'appointment', 'surgery', 'operation', 'work emergency', 'travel', 'flight',
  'delayed', 'cancelled', 'weather', 'storm', 'snow', 'flood', 'hurricane',
  'power outage', 'blackout', 'car broke', 'car accident', 'vehicle',
  'transportation', 'stranded', 'stuck', 'unavoidable', 'unexpected'
]

const INVALID_KEYWORDS = [
  'hangover', 'drunk', 'alcohol', 'party', 'partied', 'lazy', 'laziness',
  'tired', 'sleepy', 'exhausted', 'didn\'t feel like', 'don\'t feel like',
  'forgot', 'forgot to', 'too busy', 'busy', 'procrastinate', 'procrastination',
  'not in mood', 'don\'t want', 'don\'t feel', 'bored', 'unmotivated',
  'no motivation', 'lack motivation', 'not motivated', 'can\'t be bothered',
  'couldn\'t be bothered', 'didn\'t want to', 'didn\'t feel like it',
  'too tired', 'too lazy', 'not feeling it', 'skip', 'skipped', 'just didn\'t'
]

export function validateMissedReason(reason: string): ValidationResult {
  const reasonLower = reason.toLowerCase().trim()
  
  if (!reasonLower || reasonLower.length < 3) {
    return {
      valid: false,
      category: 'invalid',
      message: 'Please provide a more detailed explanation',
    }
  }

  // Check for invalid keywords first (they override valid ones)
  const hasInvalidKeyword = INVALID_KEYWORDS.some(keyword => 
    reasonLower.includes(keyword)
  )

  if (hasInvalidKeyword) {
    return {
      valid: false,
      category: 'invalid',
      message: 'This reason is not considered valid. Your streak will be reset.',
    }
  }

  // Check for valid keywords
  const hasValidKeyword = VALID_KEYWORDS.some(keyword => 
    reasonLower.includes(keyword)
  )

  if (hasValidKeyword) {
    return {
      valid: true,
      category: 'valid',
      message: 'Valid reason accepted. Your streak will be preserved.',
    }
  }

  // Neutral - no clear keywords found
  return {
    valid: true, // Default to valid if unclear
    category: 'neutral',
    message: 'Reason recorded. Please be honest with yourself!',
  }
}

