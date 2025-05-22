import { type ReactNode } from 'react';
import { Box, Container, Typography, Breadcrumbs, Link, Paper } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  showBreadcrumbs?: boolean;
}

const PageContainer = ({ 
  children, 
  title, 
  subtitle, 
  maxWidth = 'lg',
  showBreadcrumbs = true 
}: PageContainerProps) => {
  const location = useLocation();
  
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    
    if (pathnames.length === 0) return null;
    
    return (
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Home
        </Link>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
          
          return isLast ? (
            <Typography key={name} color="text.primary" sx={{ fontWeight: 500 }}>
              {displayName}
            </Typography>
          ) : (
            <Link 
              key={name}
              component={RouterLink} 
              to={routeTo} 
              underline="hover" 
              color="inherit"
            >
              {displayName}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      p: 3
    }}>
      <Container maxWidth={maxWidth}>
        {showBreadcrumbs && getBreadcrumbs()}
        
        {title && (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#fff' }}>
            <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Paper>
        )}
        
        {children}
      </Container>
    </Box>
  );
};

export default PageContainer;