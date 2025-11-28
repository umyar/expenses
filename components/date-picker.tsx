"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  label?: string
  id?: string
  placeholder?: string
  className?: string
  buttonClassName?: string
  labelClassName?: string
  disabled?: boolean
  required?: boolean
}

export function DatePicker({
  value,
  onValueChange,
  label,
  id = "date",
  placeholder = "Select date",
  className,
  buttonClassName,
  labelClassName,
  disabled = false,
  required = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value)

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    onValueChange?.(selectedDate)
    setOpen(false)
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <Label htmlFor={id} className={cn("px-1", labelClassName)}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !date && "text-muted-foreground",
              buttonClassName
            )}
          >
            {date ? date.toLocaleDateString() : placeholder}
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

