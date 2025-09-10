import {
  Typography,
  Container,
  Card,
  CardContent
} from '@mui/material';

const Subscription = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Subscription Management
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Subscription Details
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your subscription settings and billing information here.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Subscription;