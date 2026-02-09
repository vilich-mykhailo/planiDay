import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { uk } from 'date-fns/locale'
import './Calendar.css'

export default function Calendar({ selected, onSelect, disabled }) {
  return (
    <div className="calWrap">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        locale={uk}
        weekStartsOn={1}
        showOutsideDays={false}
        className="cal"
      />
    </div>
  )
}
