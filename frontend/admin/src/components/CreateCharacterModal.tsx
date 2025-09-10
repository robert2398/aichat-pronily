import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import { ImageList, ImageListItem } from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Style as StyleIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { apiService, type Character } from '../services/api';
import useAssets from '../hooks/useAssets';

interface CreateCharacterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editCharacter?: Character | null; // New prop for edit mode
}

interface CharacterFormData {
  name: string;
  gender: 'female' | 'male' | 'trans';
  style: string;
  ethnicity: string;
  age: number | '';
  eye_colour: string;
  hair_style: string;
  hair_colour: string;
  body_type: string;
  breast_size: string;
  butt_size: string;
  dick_size: string;
  personality: string;
  voice_type: string;
  relationship_type: string;
  clothing: string;
  special_features: string;
  user_query_instructions: string;
  avatar?: string | null;
}

const initialFormData: CharacterFormData = {
  name: '',
  gender: 'female',
  style: '',
  ethnicity: '',
  age: '',
  eye_colour: '',
  hair_style: '',
  hair_colour: '',
  body_type: '',
  breast_size: '',
  butt_size: '',
  dick_size: '',
  personality: '',
  voice_type: '',
  relationship_type: '',
  clothing: '',
  special_features: '',
  user_query_instructions: '',
  avatar: null,
};

// Gender-specific options (keys are canonical tokens: female | male | trans)
const genderOptions = {
  female: {
    style: ['Realistic', 'Anime'],
    ethnicity: ['Caucasian', 'Latina', 'Asian'],
    eye_colour: ['Blue', 'Brown', 'Green', 'Yellow', 'Red'],
    hair_style: ['Straight', 'Braids', 'Bangs', 'Curly', 'Bun', 'Short'],
    hair_colour: ['Black', 'Blonde', 'Pink', 'Redhead', 'Green', 'Yellow'],
    body_type: ['Fit', 'Skinny', 'Muscular', 'Chubby'],
    breast_size: ['Flat', 'Small', 'Medium', 'Large', 'XXL'],
    butt_size: ['Small', 'Medium', 'Large', 'Athletic'],
    personality: ['Caregiver', 'Sage', 'Innocent', 'Jester', 'Temptress', 'Dominate', 'Lover', 'Nympho', 'Mean'],
    voice_type: ['Emotice', 'Caring', 'Naughty', 'Flirty', 'Addictictive', 'Loving', 'Dominating'],
    relationship_type: ['Stranger', 'Schoolmate', 'Colleague', 'Mentor', 'Girlfriend', 'Sex Friend', 'Wife', 'Mistress', 'Friend'],
    clothing: ['Bikini', 'Skirt', 'Cheerleader Outfit', 'Pencil Dress', 'Long Dress', 'Soccer Uniform', 'Tennis Outfit', 'Wedding Dress', 'Fancy Dress', 'Witch costume', 'Summer Dress', 'Jeans', 'Maid Outfits', 'Medieval Armor', 'Lab Coat', 'Cowboy Outfit', 'Princess Outfit', 'Corset', 'Long Coat', 'Hoodie', 'Leggings', 'Ninja Outfit', 'Pajamas', 'Hijab', 'Police Uniform'],
    special_features: ['Public Hair', 'Pregnant', 'Glasses', 'Freckles', 'Tattoos', 'Belly Piercing', 'Nipple Piercing']
  },
  male: {
    style: ['Realistic', 'Anime'],
    ethnicity: ['Caucasian', 'Asian', 'Arabic', 'Black'],
    eye_colour: ['Blue', 'Brown', 'Green', 'Yellow', 'Red'],
    hair_style: ['Long', 'Short', 'Bun', 'Curly'],
    hair_colour: ['Black', 'Blonde', 'Pink', 'Redhead', 'Green', 'Yellow'],
    body_type: ['Fit', 'Skinny', 'Muscular', 'Chubby'],
    dick_size: ['Small', 'Average', 'Large', 'Huge'],
    personality: ['Caregiver', 'Sage', 'Innocent', 'Jester', 'Temptress', 'Dominate', 'Lover', 'Nympho', 'Mean'],
    voice_type: ['Emotice', 'Caring', 'Naughty', 'Flirty', 'Addictictive', 'Loving', 'Dominating'],
    relationship_type: ['Stranger', 'Schoolmate', 'Colleague', 'Mentor', 'Girlfriend', 'Sex Friend', 'Wife', 'Mistress', 'Friend'],
    clothing: ['Suit & Shirt', 'Pant & Sweater', 'Chef', 'Blazer & T-Shirt', 'Police', 'Denim & Khakis', 'Hip-Hop', 'Tennis Outfit', 'Military', 'Waiter', 'Tee & Leather Pants', 'Summer Dress', 'Jeans', 'Shorts & Henley', 'Jacket & Chinos', 'Surfer', 'Cowboy Outfit', 'Basketball', 'Shirt & Corduroy Pants', 'Long Coat', 'Hoodie', 'Cowboy', 'Ninja Outfit', 'Astronaut', 'Polo & Lines Pants', 'Ski'],
    special_features: ['Public Hair', 'Glasses', 'Freckles', 'Tattoos']
  },
  trans: {
    style: ['Realistic', 'Anime'],
    ethnicity: ['Caucasian', 'Latina', 'Asian'],
    eye_colour: ['Blue', 'Brown', 'Green', 'Yellow', 'Red'],
    hair_style: ['Straight', 'Braids', 'Bangs', 'Curly', 'Bun', 'Short'],
    hair_colour: ['Black', 'Blonde', 'Pink', 'Redhead', 'Green', 'Yellow'],
    body_type: ['Fit', 'Skinny', 'Muscular', 'Chubby'],
    breast_size: ['Flat', 'Small', 'Medium', 'Large', 'XXL'],
    butt_size: ['Small', 'Medium', 'Large', 'Athletic'],
    personality: ['Caregiver', 'Sage', 'Innocent', 'Jester', 'Temptress', 'Dominate', 'Lover', 'Nympho', 'Mean'],
    voice_type: ['Emotice', 'Caring', 'Naughty', 'Flirty', 'Addictictive', 'Loving', 'Dominating'],
    relationship_type: ['Stranger', 'Schoolmate', 'Colleague', 'Mentor', 'Girlfriend', 'Sex Friend', 'Wife', 'Mistress', 'Friend'],
    clothing: ['Bikini', 'Skirt', 'Cheerleader Outfit', 'Pencil Dress', 'Long Dress', 'Soccer Uniform', 'Tennis Outfit', 'Wedding Dress', 'Fancy Dress', 'Witch costume', 'Summer Dress', 'Jeans', 'Maid Outfits', 'Medieval Armor', 'Lab Coat', 'Cowboy Outfit', 'Princess Outfit', 'Corset', 'Long Coat', 'Hoodie', 'Leggings', 'Ninja Outfit', 'Pajamas', 'Hijab', 'Police Uniform'],
    special_features: ['Public Hair', 'Pregnant', 'Glasses', 'Freckles', 'Tattoos', 'Belly Piercing', 'Nipple Piercing']
  }
};

export const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  open,
  onClose,
  onSuccess,
  editCharacter,
}) => {
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // normalize gender key and load assets for the current gender (falls back to hardcoded lists)
  const genderKey = formData.gender === 'male' ? 'male' : 'female';
  // Load ethnicity assets (now using canonical subfolder name 'ethnicity')
  const ethnicityAssets = useAssets(genderKey, 'ethnicity').items;
  // Load character/avatar assets (canonical subfolder 'character') for the avatar picker
  const characterAssets = useAssets(genderKey, 'character').items;

  const isEditMode = Boolean(editCharacter);

  // Populate form data when editing
  useEffect(() => {
    if (editCharacter && open) {
      // normalize incoming character.gender to canonical tokens
      const mapGender = (g: any) => {
        const low = String(g || '').toLowerCase()
        if (['girl', 'girls', 'female', 'woman', 'women'].includes(low)) return 'female'
        if (['men', 'man', 'male', 'guys'].includes(low)) return 'male'
        if (low === 'trans') return 'trans'
        return 'female'
      }

      setFormData({
        name: editCharacter.name,
        gender: mapGender(editCharacter.gender),
        style: editCharacter.style,
        ethnicity: editCharacter.ethnicity,
        age: editCharacter.age,
        eye_colour: editCharacter.eye_colour,
        hair_style: editCharacter.hair_style,
        hair_colour: editCharacter.hair_colour,
        body_type: editCharacter.body_type,
        breast_size: editCharacter.breast_size || '',
        butt_size: editCharacter.butt_size || '',
        dick_size: editCharacter.dick_size || '',
        personality: editCharacter.personality,
        voice_type: editCharacter.voice_type,
        relationship_type: editCharacter.relationship_type,
        clothing: editCharacter.clothing,
        special_features: editCharacter.special_features,
        user_query_instructions: editCharacter.user_query_instructions || '',
        avatar: (editCharacter as any).avatar || null,
      });
    } else if (!editCharacter && open) {
      setFormData(initialFormData);
    }
  }, [editCharacter, open]);

  const handleInputChange = (field: keyof CharacterFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: field === 'age' ? (value === '' ? '' : Number(value)) : value,
      };

      // Reset dependent fields when gender changes
      if (field === 'gender') {
        return {
          ...newData,
          style: '',
          ethnicity: '',
          eye_colour: '',
          hair_style: '',
          hair_colour: '',
          body_type: '',
          breast_size: '',
          butt_size: '',
          dick_size: '',
          personality: '',
          voice_type: '',
          relationship_type: '',
          clothing: '',
          special_features: '',
        };
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Character name is required.');
      return;
    }

    if (!formData.style) {
      setError('Style is required.');
      return;
    }

    if (!formData.ethnicity) {
      setError('Ethnicity is required.');
      return;
    }

    if (formData.age === '') {
      setError('Age is required.');
      return;
    }

    if (!formData.eye_colour) {
      setError('Eye colour is required.');
      return;
    }

    if (!formData.hair_style) {
      setError('Hair style is required.');
      return;
    }

    if (!formData.hair_colour) {
      setError('Hair colour is required.');
      return;
    }

    if (!formData.body_type) {
      setError('Body type is required.');
      return;
    }

    if (!formData.personality) {
      setError('Personality is required.');
      return;
    }

    if (!formData.voice_type) {
      setError('Voice type is required.');
      return;
    }

    if (!formData.relationship_type) {
      setError('Relationship type is required.');
      return;
    }

    if (!formData.clothing) {
      setError('Clothing is required.');
      return;
    }

    if (!formData.special_features) {
      setError('Special features is required.');
      return;
    }

    // Gender-specific validations
  if ((formData.gender === 'female' || formData.gender === 'trans') && !formData.breast_size) {
      setError('Breast size is required.');
      return;
    }

  if ((formData.gender === 'female' || formData.gender === 'trans') && !formData.butt_size) {
      setError('Butt size is required.');
      return;
    }

  if (formData.gender === 'male' && !formData.dick_size) {
      setError('Dick size is required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        gender: formData.gender,
        style: formData.style,
        ethnicity: formData.ethnicity,
        age: Number(formData.age),
        eye_colour: formData.eye_colour,
        hair_style: formData.hair_style,
        hair_colour: formData.hair_colour,
        body_type: formData.body_type,
  // Gender-specific fields with null values for other genders
  breast_size: (formData.gender === 'female' || formData.gender === 'trans') ? formData.breast_size : null,
  butt_size: (formData.gender === 'female' || formData.gender === 'trans') ? formData.butt_size : null,
  dick_size: formData.gender === 'male' ? formData.dick_size : null,
        personality: formData.personality,
        voice_type: formData.voice_type,
        relationship_type: formData.relationship_type,
        clothing: formData.clothing,
        special_features: formData.special_features,
        user_query_instructions: formData.user_query_instructions.trim() || null,
  avatar: formData.avatar || null,
      };

      if (isEditMode && editCharacter) {
        await apiService.editCharacter(editCharacter.id, payload);
      } else {
        await apiService.createCharacter(payload);
      }
      
      // Reset form
      setFormData(initialFormData);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'editing' : 'creating'} character:`, err);
      setError(
        err.response?.data?.detail || 
        `An error occurred while ${isEditMode ? 'editing' : 'creating'} the character. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData(initialFormData);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'grey.900' }}>
                {isEditMode ? 'Edit Character' : 'Create New Character'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.600', mt: 0.5 }}>
                {isEditMode 
                  ? 'Modify the character details and appearance'
                  : 'Design a unique AI character with custom personality and appearance'
                }
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: 'grey.500',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              bgcolor: 'grey.50',
              borderColor: 'grey.200',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Basic Information
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Character Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                  disabled={loading}
                  placeholder="Enter character name"
                />

                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender}
                    onChange={handleInputChange('gender')}
                    label="Gender"
                  >
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="trans">Trans</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Avatar picker (small thumbnails) */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="subtitle2">Choose Avatar</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    size="small"
                    onClick={() => setFormData(prev => ({ ...prev, avatar: null }))}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </Box>

                <ImageList cols={6} gap={8} sx={{ width: '100%', maxHeight: 160, overflow: 'auto' }}>
                  {characterAssets.slice(0, 36).map(item => (
                    <ImageListItem key={item.id} sx={{ cursor: 'pointer', borderRadius: 1 }}>
                      <img
                        src={item.url}
                        alt={item.name}
                        style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 6, border: item.url === formData.avatar ? '2px solid #1976d2' : '2px solid transparent' }}
                        onClick={() => setFormData(prev => ({ ...prev, avatar: item.url }))}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>

                {/* Selected avatar preview */}
                {formData.avatar && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">Selected:</Typography>
                    <Box component="img" src={formData.avatar} alt="selected avatar" sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }} />
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Style</InputLabel>
                  <Select
                    value={formData.style}
                    onChange={handleInputChange('style')}
                    label="Style"
                  >
                    {genderOptions[formData.gender]?.style?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Ethnicity</InputLabel>
                  <Select
                    value={formData.ethnicity}
                    onChange={handleInputChange('ethnicity')}
                    label="Ethnicity"
                  >
                      {ethnicityAssets.length > 0 ? (
                        ethnicityAssets.map((asset) => (
                          <MenuItem key={asset.id} value={asset.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <img src={asset.url} alt={asset.name} style={{ width: 28, height: 20, objectFit: 'cover', borderRadius: 4 }} />
                            <span>{asset.name}</span>
                          </MenuItem>
                        ))
                      ) : (
                        genderOptions[formData.gender]?.ethnicity?.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))
                      )}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={handleInputChange('age')}
                  required
                  disabled={loading}
                  placeholder="Enter age"
                  inputProps={{ min: 1, max: 200 }}
                />

                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Eye Colour</InputLabel>
                  <Select
                    value={formData.eye_colour}
                    onChange={handleInputChange('eye_colour')}
                    label="Eye Colour"
                  >
                    {genderOptions[formData.gender]?.eye_colour?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>

          {/* Appearance Details */}
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              bgcolor: 'grey.50',
              borderColor: 'grey.200',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StyleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Appearance Details
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Hair Style</InputLabel>
                  <Select
                    value={formData.hair_style}
                    onChange={handleInputChange('hair_style')}
                    label="Hair Style"
                  >
                    {genderOptions[formData.gender]?.hair_style?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Hair Colour</InputLabel>
                  <Select
                    value={formData.hair_colour}
                    onChange={handleInputChange('hair_colour')}
                    label="Hair Colour"
                  >
                    {genderOptions[formData.gender]?.hair_colour?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Body Type</InputLabel>
                  <Select
                    value={formData.body_type}
                    onChange={handleInputChange('body_type')}
                    label="Body Type"
                  >
                    {genderOptions[formData.gender]?.body_type?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Conditional fields based on gender */}
                {(formData.gender === 'female' || formData.gender === 'trans') && (
                  <FormControl fullWidth required disabled={loading}>
                    <InputLabel>Breast Size</InputLabel>
                    <Select
                      value={formData.breast_size}
                      onChange={handleInputChange('breast_size')}
                      label="Breast Size"
                    >
                      {genderOptions[formData.gender]?.breast_size?.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {formData.gender === 'male' && (
                  <FormControl fullWidth required disabled={loading}>
                    <InputLabel>Dick Size</InputLabel>
                    <Select
                      value={formData.dick_size}
                      onChange={handleInputChange('dick_size')}
                      label="Dick Size"
                    >
                      {genderOptions[formData.gender]?.dick_size?.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {(formData.gender === 'female' || formData.gender === 'trans') && (
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <FormControl fullWidth required disabled={loading}>
                    <InputLabel>Butt Size</InputLabel>
                    <Select
                      value={formData.butt_size}
                      onChange={handleInputChange('butt_size')}
                      label="Butt Size"
                    >
                      {genderOptions[formData.gender]?.butt_size?.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ flex: 1 }} /> {/* Spacer */}
                </Box>
              )}
            </Box>
          </Paper>

          {/* Personality & Behavior */}
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              bgcolor: 'grey.50',
              borderColor: 'grey.200',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DescriptionIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Personality & Behavior
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Personality</InputLabel>
                  <Select
                    value={formData.personality}
                    onChange={handleInputChange('personality')}
                    label="Personality"
                  >
                    {genderOptions[formData.gender]?.personality?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Voice Type</InputLabel>
                  <Select
                    value={formData.voice_type}
                    onChange={handleInputChange('voice_type')}
                    label="Voice Type"
                  >
                    {genderOptions[formData.gender]?.voice_type?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Relationship Type</InputLabel>
                  <Select
                    value={formData.relationship_type}
                    onChange={handleInputChange('relationship_type')}
                    label="Relationship Type"
                  >
                    {genderOptions[formData.gender]?.relationship_type?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Clothing</InputLabel>
                  <Select
                    value={formData.clothing}
                    onChange={handleInputChange('clothing')}
                    label="Clothing"
                  >
                    {genderOptions[formData.gender]?.clothing?.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <FormControl fullWidth required disabled={loading}>
                <InputLabel>Special Features</InputLabel>
                <Select
                  value={formData.special_features}
                  onChange={handleInputChange('special_features')}
                  label="Special Features"
                >
                  {genderOptions[formData.gender]?.special_features?.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* User Query Instructions */}
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              bgcolor: 'grey.50',
              borderColor: 'grey.200',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DescriptionIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                User Query Instructions
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="User Query Instructions"
              value={formData.user_query_instructions}
              onChange={handleInputChange('user_query_instructions')}
              disabled={loading}
              multiline
              rows={4}
              placeholder="Describe how this character should respond to user queries, their personality traits, communication style, etc. (optional)"
              helperText="This helps define the character's personality and how they interact with users"
            />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ 
            color: 'grey.600',
            fontWeight: 500,
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim() || !formData.style || !formData.ethnicity || formData.age === '' || !formData.eye_colour || !formData.hair_style || !formData.hair_colour || !formData.body_type || !formData.personality || !formData.voice_type || !formData.relationship_type || !formData.clothing || !formData.special_features || 
            ((formData.gender === 'female' || formData.gender === 'trans') && (!formData.breast_size || !formData.butt_size)) ||
            (formData.gender === 'male' && !formData.dick_size)}
          sx={{
            fontWeight: 600,
            px: 4,
            py: 1.5,
            borderRadius: 2,
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {isEditMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditMode ? 'Update Character' : 'Create Character'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
