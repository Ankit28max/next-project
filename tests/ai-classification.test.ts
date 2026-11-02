import { describe, it, expect } from 'vitest';
import { classifyComplaintDeterministic } from '../src/lib/ai/classification';

describe('AI Complaint Classification Engine', () => {
  it('correctly classifies road and pothole grievances', () => {
    const result = classifyComplaintDeterministic(
      'Deep pothole outside metro station',
      'The crater is damaging cars and asphalt has broken down.'
    );

    expect(result.predictedCategory).toBe('Roads & Potholes');
    expect(result.recommendedDepartmentCode).toBe('PWD');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('correctly classifies water supply and pipeline leaks', () => {
    const result = classifyComplaintDeterministic(
      'Water supply pipe burst',
      'Drinking water pipeline has burst and is flooding the central street.'
    );

    expect(result.predictedCategory).toBe('Water Supply & Leakage');
    expect(result.recommendedDepartmentCode).toBe('WATER');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('correctly elevates priority to URGENT for hazardous emergencies', () => {
    const result = classifyComplaintDeterministic(
      'Urgent sparking wire and electric pole hazard',
      'Exposed live wire hanging from transformer near school.'
    );

    expect(result.predictedCategory).toBe('Streetlights & Electricity');
    expect(result.suggestedPriority).toBe('URGENT');
    expect(result.recommendedDepartmentCode).toBe('ELEC');
  });

  it('provides safe fallback for ambiguous phrasing', () => {
    const result = classifyComplaintDeterministic(
      'Miscellaneous issue in my colony',
      'Need municipal attention for general maintenance.'
    );

    expect(result.predictedCategory).toBe('Other Civic Issues');
    expect(result.confidence).toBeLessThan(0.8);
  });
});
