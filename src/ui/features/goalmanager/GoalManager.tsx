import { faCalendarAlt } from '@fortawesome/free-regular-svg-icons'
import { faDollarSign, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'
import 'date-fns'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { updateGoal as updateGoalApi } from '../../../api/lib'
import { Goal } from '../../../api/types'
import { selectGoalsMap, updateGoal as updateGoalRedux } from '../../../store/goalsSlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import DatePicker from '../../components/DatePicker'
import { Theme } from '../../components/Theme'

// NEW imports for emoji picker
import { BaseEmoji } from 'emoji-mart'
import EmojiPicker from '../../components/EmojiPicker' // adjust path if necessary

type Props = { goal: Goal }
export function GoalManager(props: Props) {
  const dispatch = useAppDispatch()

  const goal = useAppSelector(selectGoalsMap)[props.goal.id]

  const [name, setName] = useState<string | null>(null)
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [targetAmount, setTargetAmount] = useState<number | null>(null)

  // NEW: icon & emoji picker state
  const [icon, setIcon] = useState<string | null>(null)
  const [emojiPickerIsOpen, setEmojiPickerIsOpen] = useState(false)

  useEffect(() => {
    setName(props.goal.name)
    setTargetDate(props.goal.targetDate)
    setTargetAmount(props.goal.targetAmount)
  }, [
    props.goal.id,
    props.goal.name,
    props.goal.targetDate,
    props.goal.targetAmount,
  ])

  // keep local icon in sync with incoming prop
  useEffect(() => {
    setIcon(props.goal.icon ?? null)
  }, [props.goal.icon])

  useEffect(() => {
    setName(goal.name)
  }, [goal.name])

  const updateNameOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value
    setName(nextName)
    const updatedGoal: Goal = {
      ...props.goal,
      name: nextName,
    }
    dispatch(updateGoalRedux(updatedGoal))
    updateGoalApi(props.goal.id, updatedGoal)
  }

  const updateTargetAmountOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTargetAmount = parseFloat(event.target.value)
    setTargetAmount(nextTargetAmount)
    const updatedGoal: Goal = {
      ...props.goal,
      name: name ?? props.goal.name,
      targetDate: targetDate ?? props.goal.targetDate,
      targetAmount: nextTargetAmount,
    }
    dispatch(updateGoalRedux(updatedGoal))
    updateGoalApi(props.goal.id, updatedGoal)
  }

  const pickDateOnChange = (date: MaterialUiPickersDate) => {
    if (date != null) {
      setTargetDate(date)
      const updatedGoal: Goal = {
        ...props.goal,
        name: name ?? props.goal.name,
        targetDate: date ?? props.goal.targetDate,
        targetAmount: targetAmount ?? props.goal.targetAmount,
      }
      dispatch(updateGoalRedux(updatedGoal))
      updateGoalApi(props.goal.id, updatedGoal)
    }
  }

  // helper: whether we currently have an icon
  const hasIcon = () => icon != null && icon !== ''

  // NEW: emoji pick handler
  const pickEmojiOnClick = (emoji: BaseEmoji, event: React.MouseEvent) => {
    // Stop event propagation
    event.stopPropagation()

    // set icon locally (optimistic)
    const chosen = (emoji && (emoji.native ?? (emoji.colons ?? ''))) || props.goal.icon
    setIcon(chosen ?? null)
    setEmojiPickerIsOpen(false)

    // Build updated goal
    const updatedGoal: Goal = {
      ...props.goal,
      icon: chosen ?? props.goal.icon,
      name: name ?? props.goal.name,
      targetDate: targetDate ?? props.goal.targetDate,
      targetAmount: targetAmount ?? props.goal.targetAmount,
    }

    // Update Redux store (optimistic)
    dispatch(updateGoalRedux(updatedGoal))

    // Update backend (non-blocking)
    try {
      updateGoalApi(props.goal.id, updatedGoal)
    } catch (err) {
      // If API call fails you may want to show an error or revert
      // For now we log it
      // eslint-disable-next-line no-console
      console.error('Failed to persist icon change', err)
    }
  }

  return (
    <GoalManagerContainer>
      <NameInput value={name ?? ''} onChange={updateNameOnChange} />

      <Group>
        <Field name="Target Date" icon={faCalendarAlt} />
        <Value>
          <DatePicker value={targetDate} onChange={pickDateOnChange} />
        </Value>
      </Group>

      <Group>
        <Field name="Target Amount" icon={faDollarSign} />
        <Value>
          <StringInput value={targetAmount ?? ''} onChange={updateTargetAmountOnChange} />
        </Value>
      </Group>

      <Group>
        <Field name="Balance" icon={faDollarSign} />
        <Value>
          <StringValue>{props.goal.balance}</StringValue>
        </Value>
      </Group>

      <Group>
        <Field name="Date Created" icon={faCalendarAlt} />
        <Value>
          <StringValue>{new Date(props.goal.created).toLocaleDateString()}</StringValue>
        </Value>
      </Group>

      {/* NEW: Icon picker group */}
      <Group>
        <Field name="Icon" icon={faCalendarAlt} />
        <Value>
          <AddIconButtonContainer shouldShow={!hasIcon()}>
            <AddIconButton
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setEmojiPickerIsOpen(true)
              }}
            >
              + Add icon
            </AddIconButton>
          </AddIconButtonContainer>

          <GoalIconContainer shouldShow={hasIcon()}>
            <IconButton
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setEmojiPickerIsOpen(true)
              }}
              aria-label="Edit icon"
            >
              <span style={{ fontSize: '1.8rem' }}>{icon}</span>
            </IconButton>
          </GoalIconContainer>

          <EmojiPickerContainer
            isOpen={emojiPickerIsOpen}
            hasIcon={hasIcon()}
            onClick={(e) => e.stopPropagation()}
          >
            <EmojiPicker onClick={pickEmojiOnClick} />
          </EmojiPickerContainer>
        </Value>
      </Group>
    </GoalManagerContainer>
  )
}

type FieldProps = { name: string; icon: IconDefinition }
type AddIconButtonContainerProps = { shouldShow: boolean }
type GoalIconContainerProps = { shouldShow: boolean }
type EmojiPickerContainerProps = { isOpen: boolean; hasIcon: boolean }

const Field = (props: FieldProps) => (
  <FieldContainer>
    <FontAwesomeIcon icon={props.icon} size="2x" />
    <FieldName>{props.name}</FieldName>
  </FieldContainer>
)

const GoalManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  position: relative;
`

const Group = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
`
const NameInput = styled.input`
  display: flex;
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 4rem;
  font-weight: bold;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const FieldName = styled.h1`
  font-size: 1.8rem;
  margin-left: 1rem;
  color: rgba(174, 174, 174, 1);
  font-weight: normal;
`
const FieldContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 20rem;

  svg {
    color: rgba(174, 174, 174, 1);
  }
`
const StringValue = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
`
const StringInput = styled.input`
  display: flex;
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1.8rem;
  font-weight: bold;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const Value = styled.div`
  margin-left: 2rem;
`

/* NEW styled components for emoji UI */

const AddIconButtonContainer = styled.div<AddIconButtonContainerProps>`
  display: ${(props) => (props.shouldShow ? 'block' : 'none')};
`

const GoalIconContainer = styled.div<GoalIconContainerProps>`
  display: ${(props) => (props.shouldShow ? 'block' : 'none')};
`

const AddIconButton = styled.button`
  background: transparent;
  border: 1px dashed rgba(174, 174, 174, 0.6);
  padding: 0.5rem 1rem;
  font-size: 1.6rem;
  cursor: pointer;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
`

const EmojiPickerContainer = styled.div<EmojiPickerContainerProps>`
  display: ${(props) => (props.isOpen ? 'flex' : 'none')};
  position: absolute;
  top: ${(props) => (props.hasIcon ? '10rem' : '2rem')};
  left: 0;
  z-index: 50;
`
