import {
  Typography,
  Container,
  Card,
  CardContent
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const Success = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thank you for your payment. Your subscription has been activated successfully.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Success;