import {
  Typography,
  Container,
  Card,
  CardContent
} from '@mui/material';

const Cancel = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
            Payment Canceled
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your payment has been canceled. You can try again or contact support if you need assistance.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Cancel;