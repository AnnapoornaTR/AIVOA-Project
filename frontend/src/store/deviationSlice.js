import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { deviationService } from '../services/api';

const initialFormData = {
  site_plant: '',
  date_of_occurrence: '',
  title: '',
  source: '',
  related_product_material: '',
  batch_lot_number: '',
  detailed_description: '',
  initial_impact: '',
  initial_severity: '',
  impact_reason: '',
  severity_reason: '',
  ai_confidence: null,
};

const initialState = {
  formData: { ...initialFormData },
  aiAnalysis: null,
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStatus: '',
  isSaving: false,
  saveSuccess: false,
  savedDeviation: null,
  error: null,
  aiPopulatedFields: [],
  userEditedFields: [],
  missingInformation: [],
  uploadedFileName: null,
  pastedText: '',
  chatMessages: [
    {
      role: 'assistant',
      content: 'Hello! I am your AI Deviation Assistant. Upload a document or paste deviation notes to get started.',
    },
  ],
  isChatting: false,
};

export const analyzeDeviationThunk = createAsyncThunk(
  'deviation/analyze',
  async (fileOrText, { dispatch, rejectWithValue }) => {
    try {
      // Simulate real-time workflow stages for responsive user experience
      dispatch(deviationSlice.actions.setAnalysisProgress({ progress: 15, status: 'Reading document content...' }));
      await new Promise((r) => setTimeout(r, 400));

      dispatch(deviationSlice.actions.setAnalysisProgress({ progress: 40, status: 'Extracting deviation information...' }));
      await new Promise((r) => setTimeout(r, 400));

      dispatch(deviationSlice.actions.setAnalysisProgress({ progress: 65, status: 'Assessing impact and severity...' }));

      const data = await deviationService.analyzeDeviation(fileOrText);

      dispatch(deviationSlice.actions.setAnalysisProgress({ progress: 90, status: 'Validating against pharmaceutical QMS rules...' }));
      await new Promise((r) => setTimeout(r, 300));

      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI analysis could not be completed. Please retry.';
      return rejectWithValue(msg);
    }
  }
);

export const saveDeviationThunk = createAsyncThunk(
  'deviation/save',
  async (deviationData, { rejectWithValue }) => {
    try {
      const saved = await deviationService.saveDeviation(deviationData);
      return saved;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save deviation. Please verify required fields.';
      return rejectWithValue(msg);
    }
  }
);

export const askAiThunk = createAsyncThunk(
  'deviation/askAi',
  async (question, { getState, rejectWithValue }) => {
    try {
      const state = getState().deviation;
      const payload = {
        question,
        document_text: state.aiAnalysis?.source_text || state.pastedText || '',
        extracted_data: state.aiAnalysis || null,
        history: state.chatMessages.map((m) => ({ role: m.role, content: m.content })),
      };
      const res = await deviationService.askAI(payload);
      return { question, answer: res.answer };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to query AI assistant.';
      return rejectWithValue(msg);
    }
  }
);

export const deviationSlice = createSlice({
  name: 'deviation',
  initialState,
  reducers: {
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
      if (!state.userEditedFields.includes(field)) {
        state.userEditedFields.push(field);
      }
    },
    setPastedText: (state, action) => {
      state.pastedText = action.payload;
    },
    setUploadedFileName: (state, action) => {
      state.uploadedFileName = action.payload;
    },
    setAnalysisProgress: (state, action) => {
      state.analysisProgress = action.payload.progress;
      state.analysisStatus = action.payload.status;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetForm: (state) => {
      state.formData = { ...initialFormData };
      state.aiAnalysis = null;
      state.isAnalyzing = false;
      state.analysisProgress = 0;
      state.analysisStatus = '';
      state.isSaving = false;
      state.saveSuccess = false;
      state.savedDeviation = null;
      state.error = null;
      state.aiPopulatedFields = [];
      state.userEditedFields = [];
      state.missingInformation = [];
      state.uploadedFileName = null;
      state.pastedText = '';
      state.chatMessages = [
        {
          role: 'assistant',
          content: 'Form reset. Upload a document or paste deviation notes to begin a new entry.',
        },
      ];
      state.isChatting = false;
    },
    dismissSuccessModal: (state) => {
      state.saveSuccess = false;
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Analyze Deviation
      .addCase(analyzeDeviationThunk.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(analyzeDeviationThunk.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.analysisProgress = 100;
        state.analysisStatus = 'Analysis complete — review the extracted information before saving.';
        const data = action.payload;
        state.aiAnalysis = data;
        state.missingInformation = data.missing_information || [];

        // Apply AI extraction to fields NOT edited by the user
        const newAiPopulated = [...state.aiPopulatedFields];
        const fieldsToMap = [
          'site_plant',
          'date_of_occurrence',
          'title',
          'source',
          'related_product_material',
          'batch_lot_number',
          'detailed_description',
          'initial_impact',
          'initial_severity',
          'impact_reason',
          'severity_reason',
        ];

        fieldsToMap.forEach((field) => {
          if (!state.userEditedFields.includes(field) && data[field]) {
            state.formData[field] = data[field];
            if (!newAiPopulated.includes(field)) {
              newAiPopulated.push(field);
            }
          }
        });

        if (data.confidence) {
          state.formData.ai_confidence = data.confidence;
        }

        state.aiPopulatedFields = newAiPopulated;

        // Add assistant notification in chat
        state.chatMessages.push({
          role: 'assistant',
          content: `I've analyzed the deviation for **Batch ${data.batch_lot_number || 'N/A'}** and populated the form. Recommended Initial Impact: **${data.initial_impact || 'Moderate'}**, Initial Severity: **${data.initial_severity || 'Major'}**. Feel free to ask any questions.`,
        });
      })
      .addCase(analyzeDeviationThunk.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.analysisProgress = 0;
        state.analysisStatus = '';
        state.error = action.payload || 'AI analysis could not be completed.';
      })

      // Save Deviation
      .addCase(saveDeviationThunk.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveDeviationThunk.fulfilled, (state, action) => {
        state.isSaving = false;
        state.saveSuccess = true;
        state.savedDeviation = action.payload;
      })
      .addCase(saveDeviationThunk.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload || 'Failed to save deviation.';
      })

      // Chat with AI
      .addCase(askAiThunk.pending, (state, action) => {
        state.isChatting = true;
        state.chatMessages.push({ role: 'user', content: action.meta.arg });
      })
      .addCase(askAiThunk.fulfilled, (state, action) => {
        state.isChatting = false;
        state.chatMessages.push({ role: 'assistant', content: action.payload.answer });
      })
      .addCase(askAiThunk.rejected, (state, action) => {
        state.isChatting = false;
        state.chatMessages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving the answer. Please try again.',
        });
      });
  },
});

export const {
  updateFormField,
  setPastedText,
  setUploadedFileName,
  setAnalysisProgress,
  clearError,
  resetForm,
  dismissSuccessModal,
  addChatMessage,
} = deviationSlice.actions;

export default deviationSlice.reducer;
