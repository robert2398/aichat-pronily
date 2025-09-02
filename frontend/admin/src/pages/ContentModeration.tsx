import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';
import { apiService } from '../services/api';
import type { AllModelsResponse, ChatModel, ImageModel, SpeechModel } from '../services/api';

const tabs = ['System Prompt', 'Keywords', 'Settings'];

// A generic editable card component
const EditableModelCard: React.FC<{
  model: ChatModel | ImageModel | SpeechModel;
  onSave: (modelData: any) => Promise<any>;
  onUpdate: (updatedModel: any) => void;
  onSuccess: (message: string) => void;
  children: (isEditing: boolean, data: any, setData: Function) => React.ReactNode;
}> = ({ model, onSave, onUpdate, onSuccess, children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState(model);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    try {
      const response = await onSave(data);
      // The actual updated model is nested inside the response
      const updatedModel = response.chat_model || response.image_model || response.speech_model;
      
      onSuccess(response.detail || 'Model updated successfully!'); // Use success callback instead of alert
      onUpdate(updatedModel);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save changes.');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setData(model); // Reset changes
    setIsEditing(false);
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {children(isEditing, data, setData)}
      </CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2 }}>
        {isEditing ? (
          <>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              startIcon={<Save />}
            >
              Save
            </Button>
            <Button 
              onClick={handleCancel} 
              variant="outlined"
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button 
            onClick={() => setIsEditing(true)} 
            variant="outlined"
            startIcon={<Edit />}
          >
            Edit
          </Button>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ m: 2, mt: 0 }}>
          {error}
        </Alert>
      )}
    </Card>
  );
};

// Component specifically for Chat Models
const ChatModelEditor: React.FC<{ 
  model: ChatModel; 
  onUpdate: (model: ChatModel) => void;
  onSuccess: (message: string) => void;
}> = ({ model, onUpdate, onSuccess }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<'prompt_standard' | 'prompt_nsfw' | 'prompt_ultra_nsfw'>('prompt_standard');

  return (
    <EditableModelCard 
      model={model} 
      onSave={(data) => apiService.editChatModel(model.id, data)} 
      onUpdate={onUpdate}
      onSuccess={onSuccess}
    >
      {(isEditing, data, setData) => (
        <>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
            {data.model_type} Chat Model
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Endpoint ID"
              value={data.endpoint_id}
              onChange={(e) => setData({ ...data, endpoint_id: e.target.value })}
              disabled={!isEditing}
              fullWidth
            />
            <TextField
              label="Model Tone"
              value={data.chat_tone}
              onChange={(e) => setData({ ...data, chat_tone: e.target.value })}
              disabled={!isEditing}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Prompt</InputLabel>
              <Select
                value={selectedPrompt}
                label="Prompt"
                onChange={(e) => setSelectedPrompt(e.target.value as any)}
              >
                <MenuItem value="prompt_standard">Standard</MenuItem>
                <MenuItem value="prompt_nsfw">NSFW</MenuItem>
                <MenuItem value="prompt_ultra_nsfw">Ultra-NSFW</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Prompt Text"
              value={data[selectedPrompt]}
              onChange={(e) => setData({ ...data, [selectedPrompt]: e.target.value })}
              multiline
              rows={6}
              disabled={!isEditing}
              fullWidth
            />
          </Box>
        </>
      )}
    </EditableModelCard>
  );
};

// Component for Image and Speech Models
const GenericModelEditor: React.FC<{ 
  model: ImageModel | SpeechModel; 
  onUpdate: (model: any) => void; 
  onSuccess: (message: string) => void;
  type: 'image' | 'speech' 
}> = ({ model, onUpdate, onSuccess, type }) => {
  const onSave = (data: any) => {
    return type === 'image' ? apiService.editImageModel(model.id, data) : apiService.editSpeechModel(model.id, data);
  };
  
  return (
    <EditableModelCard 
      model={model} 
      onSave={onSave} 
      onUpdate={onUpdate}
      onSuccess={onSuccess}
    >
      {(isEditing, data, setData) => (
        <>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
            {data.model_type.replace(/-/g, ' ')} Model
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Endpoint ID"
              value={data.endpoint_id}
              onChange={(e) => setData({ ...data, endpoint_id: e.target.value })}
              disabled={!isEditing}
              fullWidth
            />
            <TextField
              label="Prompt"
              value={data.prompt}
              onChange={(e) => setData({ ...data, prompt: e.target.value })}
              disabled={!isEditing}
              multiline
              rows={6}
              fullWidth
            />
          </Box>
        </>
      )}
    </EditableModelCard>
  );
};

// System Prompt Tab Component
const SystemPromptTab: React.FC<{ onSuccess: (message: string) => void }> = ({ onSuccess }) => {
  const [models, setModels] = useState<AllModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const data = await apiService.getAllModels();
        setModels(data);
      } catch (err) {
        setError('Failed to fetch models. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);
  
  const handleUpdate = (updatedModel: any) => {
    if (!models) return;
    
    const update = (list: any[]) => list.map(m => m.id === updatedModel.id ? updatedModel : m);

    if (models.chat_models.some(m => m.id === updatedModel.id)) {
        setModels({ ...models, chat_models: update(models.chat_models) });
    } else if (models.image_models.some(m => m.id === updatedModel.id)) {
        setModels({ ...models, image_models: update(models.image_models) });
    } else if (models.speech_models.some(m => m.id === updatedModel.id)) {
        setModels({ ...models, speech_models: update(models.speech_models) });
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading models...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {models && (
        <>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              Chat Models
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {models.chat_models.map(model => (
                <ChatModelEditor key={model.id} model={model} onUpdate={handleUpdate} onSuccess={onSuccess} />
              ))}
            </Box>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              Image Models
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {models.image_models.map(model => (
                <GenericModelEditor key={model.id} model={model} onUpdate={handleUpdate} onSuccess={onSuccess} type="image" />
              ))}
            </Box>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              Speech Models
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {models.speech_models.map(model => (
                <GenericModelEditor key={model.id} model={model} onUpdate={handleUpdate} onSuccess={onSuccess} type="speech" />
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export const ContentModeration: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Content Moderation
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 500,
              minWidth: 120,
            },
            '& .Mui-selected': {
              fontWeight: 600,
            }
          }}
        >
          {tabs.map((tab) => (
            <Tab key={tab} label={tab} />
          ))}
        </Tabs>
      </Box>
      
      <Card elevation={0} sx={{ border: 1, borderColor: 'grey.200', borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          {activeTab === 0 && <SystemPromptTab onSuccess={setSuccessMessage} />}
          {activeTab === 1 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'grey.600' }}>
                Keywords Management
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.500' }}>
                Chip list with add/delete functionality coming soon...
              </Typography>
            </Box>
          )}
          {activeTab === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'grey.600' }}>
                Content Moderation Settings
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.500' }}>
                Settings form configuration coming soon...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccessMessage('')} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};
