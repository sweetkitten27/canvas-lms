/*
 * Copyright (C) 2024 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {useEffect, useState} from 'react'
import {useScope as useI18nScope} from '@canvas/i18n'
import {ScreenReaderContent} from '@instructure/ui-a11y-content'
import {Flex} from '@instructure/ui-flex'
import {View} from '@instructure/ui-view'
import {SimpleSelect} from '@instructure/ui-simple-select'
import {Button, CloseButton} from '@instructure/ui-buttons'
import {Text} from '@instructure/ui-text'
import type {
  RubricAssessmentData,
  RubricCriterion,
  RubricRating,
  UpdateAssessmentData,
} from '../types/rubric'
import {ModernView} from './ModernView'
import {TraditionalView} from './TraditionalView'
import {InstructorScore} from './InstructorScore'
import {findCriterionMatchingRatingIndex} from './utils/rubricUtils'

const I18n = useI18nScope('rubrics-assessment-tray')

export type ViewMode = 'horizontal' | 'vertical' | 'traditional'

type RubricAssessmentContainerProps = {
  criteria: RubricCriterion[]
  hidePoints: boolean
  isPreviewMode: boolean
  isPeerReview: boolean
  isFreeFormCriterionComments: boolean
  isStandaloneContainer?: boolean
  ratingOrder: string
  rubricTitle: string
  rubricAssessmentData: RubricAssessmentData[]
  rubricSavedComments?: Record<string, string[]>
  viewModeOverride?: ViewMode
  onViewModeChange?: (viewMode: ViewMode) => void
  onDismiss: () => void
  onSubmit?: (rubricAssessmentDraftData: RubricAssessmentData[]) => void
}
export const RubricAssessmentContainer = ({
  criteria,
  hidePoints,
  isPreviewMode,
  isPeerReview,
  isFreeFormCriterionComments,
  isStandaloneContainer = false,
  ratingOrder,
  rubricTitle,
  rubricAssessmentData,
  rubricSavedComments = {},
  viewModeOverride,
  onDismiss,
  onSubmit,
  onViewModeChange,
}: RubricAssessmentContainerProps) => {
  const [viewModeSelect, setViewModeSelect] = useState<ViewMode>(viewModeOverride ?? 'traditional')
  const [rubricAssessmentDraftData, setRubricAssessmentDraftData] = useState<
    RubricAssessmentData[]
  >([])
  const viewMode = viewModeOverride ?? viewModeSelect
  const isTraditionalView = viewMode === 'traditional'
  const instructorPoints = rubricAssessmentDraftData.reduce(
    (prev, curr) => prev + (curr.points ?? 0),
    0
  )

  useEffect(() => {
    setRubricAssessmentDraftData(rubricAssessmentData)
  }, [rubricAssessmentData])

  const renderViewContainer = () => {
    if (isTraditionalView) {
      return (
        <TraditionalView
          criteria={criteria}
          hidePoints={hidePoints}
          ratingOrder={ratingOrder}
          rubricAssessmentData={rubricAssessmentDraftData}
          rubricTitle={rubricTitle}
          rubricSavedComments={rubricSavedComments}
          isPreviewMode={isPreviewMode}
          isPeerReview={isPeerReview}
          isFreeFormCriterionComments={isFreeFormCriterionComments}
          onUpdateAssessmentData={onUpdateAssessmentData}
        />
      )
    }

    return (
      <ModernView
        criteria={criteria}
        hidePoints={hidePoints}
        isPreviewMode={isPreviewMode}
        isPeerReview={isPeerReview}
        ratingOrder={ratingOrder}
        rubricSavedComments={rubricSavedComments}
        rubricAssessmentData={rubricAssessmentDraftData}
        selectedViewMode={viewMode}
        onUpdateAssessmentData={onUpdateAssessmentData}
        isFreeFormCriterionComments={isFreeFormCriterionComments}
      />
    )
  }

  const rubricHeader = isPeerReview ? I18n.t('Peer Review') : I18n.t('Rubric')

  const handleViewModeChange = (viewMode: ViewMode) => {
    setViewModeSelect(viewMode)
    onViewModeChange?.(viewMode)
  }

  const onUpdateAssessmentData = (params: UpdateAssessmentData) => {
    const {criterionId, points, comments = '', saveCommentsForLater, ratingId} = params
    const existingAssessmentIndex = rubricAssessmentDraftData.findIndex(
      a => a.criterionId === criterionId
    )
    const matchingCriteria = criteria?.find(c => c.id === criterionId)
    const criteriaRatings = matchingCriteria?.ratings ?? []
    const matchingRating: RubricRating | undefined = ratingId
      ? criteriaRatings.find(r => r.id === ratingId)
      : criteriaRatings[
          findCriterionMatchingRatingIndex(
            matchingCriteria?.ratings ?? [],
            points,
            matchingCriteria?.criterionUseRange
          )
        ]
    const matchingRatingId = matchingRating?.id ?? ''
    const ratingDescription = matchingRating?.description ?? ''
    if (existingAssessmentIndex === -1) {
      setRubricAssessmentDraftData([
        ...rubricAssessmentDraftData,
        {
          criterionId,
          points,
          comments,
          id: matchingRatingId,
          commentsEnabled: true,
          description: ratingDescription,
          saveCommentsForLater,
        },
      ])
    } else {
      setRubricAssessmentDraftData(
        rubricAssessmentDraftData.map(a =>
          a.criterionId === criterionId
            ? {
                ...a,
                comments,
                id: matchingRatingId,
                points,
                description: ratingDescription,
                saveCommentsForLater,
              }
            : a
        )
      )
    }
  }

  const shouldShowFooter = isStandaloneContainer || (!isPreviewMode && onSubmit)

  return (
    <View as="div" data-testid="enhanced-rubric-assessment-container">
      <Flex as="div" direction="column">
        <Flex.Item as="header">
          <AssessmentHeader
            hidePoints={hidePoints}
            instructorPoints={instructorPoints}
            isFreeFormCriterionComments={isFreeFormCriterionComments}
            isPreviewMode={isPreviewMode}
            isPeerReview={isPeerReview}
            isStandaloneContainer={isStandaloneContainer}
            isTraditionalView={isTraditionalView}
            onDismiss={onDismiss}
            onViewModeChange={handleViewModeChange}
            rubricHeader={rubricHeader}
            selectedViewMode={viewMode}
          />
        </Flex.Item>
        <Flex.Item shouldGrow={true} shouldShrink={true} as="main">
          <View as="div" overflowY="auto">
            {renderViewContainer()}
          </View>
        </Flex.Item>
        {shouldShowFooter && (
          <Flex.Item as="footer">
            <AssessmentFooter
              isPreviewMode={isPreviewMode}
              isStandAloneContainer={isStandaloneContainer}
              onDismiss={onDismiss}
              onSubmit={onSubmit ? () => onSubmit(rubricAssessmentDraftData) : undefined}
            />
          </Flex.Item>
        )}
      </Flex>
    </View>
  )
}

type ViewModeSelectProps = {
  isFreeFormCriterionComments: boolean
  selectedViewMode: ViewMode
  onViewModeChange: (viewMode: ViewMode) => void
}
const ViewModeSelect = ({
  isFreeFormCriterionComments,
  selectedViewMode,
  onViewModeChange,
}: ViewModeSelectProps) => {
  const handleSelect = (viewMode: string) => {
    onViewModeChange(viewMode as ViewMode)
  }

  return (
    <SimpleSelect
      renderLabel={
        <ScreenReaderContent>{I18n.t('Rubric Assessment View Mode')}</ScreenReaderContent>
      }
      width="10rem"
      height="2.375rem"
      value={selectedViewMode}
      data-testid="rubric-assessment-view-mode-select"
      onChange={(_e, {value}) => handleSelect(value as string)}
    >
      <SimpleSelect.Option
        id="traditional"
        value="traditional"
        data-testid="traditional-view-option"
      >
        {I18n.t('Traditional')}
      </SimpleSelect.Option>
      <SimpleSelect.Option id="horizontal" value="horizontal" data-testid="horizontal-view-option">
        {I18n.t('Horizontal')}
      </SimpleSelect.Option>
      {!isFreeFormCriterionComments && (
        <SimpleSelect.Option id="vertical" value="vertical" data-testid="vertical-view-option">
          {I18n.t('Vertical')}
        </SimpleSelect.Option>
      )}
    </SimpleSelect>
  )
}

type AssessmentHeaderProps = {
  hidePoints: boolean
  instructorPoints: number
  isFreeFormCriterionComments: boolean
  isPreviewMode: boolean
  isPeerReview: boolean
  isStandaloneContainer: boolean
  isTraditionalView: boolean
  onDismiss: () => void
  onViewModeChange: (viewMode: ViewMode) => void
  rubricHeader: string
  selectedViewMode: ViewMode
}
const AssessmentHeader = ({
  hidePoints,
  instructorPoints,
  isFreeFormCriterionComments,
  isPreviewMode,
  isPeerReview,
  isStandaloneContainer,
  isTraditionalView,
  onDismiss,
  onViewModeChange,
  rubricHeader,
  selectedViewMode,
}: AssessmentHeaderProps) => {
  return (
    <View
      as="div"
      padding={isTraditionalView ? '0 0 medium 0' : '0'}
      overflowX="hidden"
      overflowY="hidden"
    >
      <Flex>
        <Flex.Item align="end">
          <Text weight="bold" size="large" data-testid="rubric-assessment-header">
            {rubricHeader}
          </Text>
        </Flex.Item>
        {!isStandaloneContainer && (
          <Flex.Item align="end">
            <CloseButton
              placement="end"
              offset="x-small"
              screenReaderLabel="Close"
              onClick={onDismiss}
            />
          </Flex.Item>
        )}
      </Flex>

      <View as="hr" margin="x-small 0 small" aria-hidden={true} />
      <Flex wrap="wrap" gap="medium 0">
        <Flex.Item shouldGrow={true} shouldShrink={true}>
          <ViewModeSelect
            isFreeFormCriterionComments={isFreeFormCriterionComments}
            selectedViewMode={selectedViewMode}
            onViewModeChange={onViewModeChange}
          />
        </Flex.Item>
        {isTraditionalView && (
          <>
            {!hidePoints && (
              <Flex.Item>
                <View as="div" margin="0 large 0 0" themeOverride={{marginLarge: '2.938rem'}}>
                  <InstructorScore
                    isPeerReview={isPeerReview}
                    instructorPoints={instructorPoints}
                    isPreviewMode={isPreviewMode}
                  />
                </View>
              </Flex.Item>
            )}
          </>
        )}
      </Flex>

      {!isTraditionalView && (
        <>
          {!hidePoints && (
            <View as="div" margin="medium 0 0">
              <InstructorScore
                isPeerReview={isPeerReview}
                instructorPoints={instructorPoints}
                isPreviewMode={isPreviewMode}
              />
            </View>
          )}

          <View as="hr" margin="medium 0 medium 0" aria-hidden={true} />
        </>
      )}
    </View>
  )
}

type AssessmentFooterProps = {
  isPreviewMode: boolean
  isStandAloneContainer: boolean
  onDismiss: () => void
  onSubmit?: () => void
}
const AssessmentFooter = ({
  isPreviewMode,
  isStandAloneContainer,
  onDismiss,
  onSubmit,
}: AssessmentFooterProps) => {
  return (
    <View as="div" data-testid="rubric-assessment-footer" overflowX="hidden" overflowY="hidden">
      <Flex justifyItems="end" margin="small 0">
        {isStandAloneContainer && (
          <Flex.Item margin="0 small 0 0">
            <Button
              color="secondary"
              onClick={() => onDismiss()}
              data-testid="cancel-rubric-assessment-button"
            >
              {I18n.t('Cancel')}
            </Button>
          </Flex.Item>
        )}
        {onSubmit && !isPreviewMode && (
          <Flex.Item>
            <Button
              color="primary"
              onClick={() => onSubmit()}
              data-testid="save-rubric-assessment-button"
            >
              {I18n.t('Submit Assessment')}
            </Button>
          </Flex.Item>
        )}
      </Flex>
    </View>
  )
}
