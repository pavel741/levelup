import { render, screen } from '@testing-library/react'
import StatsCard from '../StatsCard'
import { Target } from 'lucide-react'

describe('StatsCard', () => {
  it('renders with correct title and value', () => {
    render(
      <StatsCard
        icon={Target}
        title="Test Title"
        value="100"
        subtitle="Test Subtitle"
        color="blue"
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('renders with different colors', () => {
    const { rerender } = render(
      <StatsCard
        icon={Target}
        title="Test Title"
        value="100"
        subtitle="Test Subtitle"
        color="blue"
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()

    rerender(
      <StatsCard
        icon={Target}
        title="Test Title"
        value="100"
        subtitle="Test Subtitle"
        color="purple"
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })
})

