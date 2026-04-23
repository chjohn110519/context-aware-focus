import type { SessionState, SessionAction } from '../types/session';

export const initialSessionState: SessionState = {
  participantId: null,
  assignment: null,
  currentSessionIndex: 0,
  sessionStartTs: null,
  eventLog: [],
  surveyResponses: {},
  isSessionActive: false,
  completedSessions: [],
  pdfData: null,
};

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_PARTICIPANT':
      return {
        ...initialSessionState,
        participantId: action.participantId,
        assignment: action.assignment,
        // PDF 데이터 유지
        pdfData: state.pdfData,
      };

    case 'START_SESSION':
      return {
        ...state,
        sessionStartTs: action.timestamp,
        isSessionActive: true,
        eventLog: [],
      };

    case 'END_SESSION':
      return {
        ...state,
        isSessionActive: false,
      };

    case 'LOG_EVENT':
      return {
        ...state,
        eventLog: [...state.eventLog, action.event],
      };

    case 'SAVE_SURVEY':
      return {
        ...state,
        surveyResponses: {
          ...state.surveyResponses,
          [action.condition]: action.answers,
        },
      };

    case 'NEXT_SESSION': {
      const currentCondition = state.assignment?.order[state.currentSessionIndex];
      return {
        ...state,
        currentSessionIndex: state.currentSessionIndex + 1,
        completedSessions: currentCondition
          ? [...state.completedSessions, currentCondition]
          : state.completedSessions,
        eventLog: [],
        sessionStartTs: null,
      };
    }

    case 'CLEAR_EVENT_LOG':
      return { ...state, eventLog: [] };

    case 'RESTORE':
      return { ...action.state };

    case 'SET_PDF_DATA':
      return { ...state, pdfData: action.pdfData };

    default:
      return state;
  }
}
