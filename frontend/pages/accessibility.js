import React from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Head from 'next/head';
import Navigation from '../components/Navigation';

const AccessibilityStatement = () => {
  return (
    <>
      <Head>
        <title>Accessibility Statement - Wick Wax & Relax</title>
        <meta name="description" content="Accessibility statement for Wick Wax & Relax website" />
      </Head>
      <Navigation />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Accessibility Statement
        </Typography>
        
        <Typography variant="body1" paragraph>
          This accessibility statement applies to the Wick Wax & Relax website (www.wickwaxrelax.co.uk). 
          This website is run by Wick Wax & Relax. We want as many people as possible to be able to use this website.
        </Typography>
        
        <Typography variant="body1" paragraph>
          For example, that means you should be able to:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText primary="Change colours, contrast levels and fonts" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Zoom in up to 300% without the text spilling off the screen" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Navigate the website using just a keyboard" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Navigate the website using speech recognition software" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Listen to most of the website using a screen reader" />
          </ListItem>
        </List>
        
        <Typography variant="body1" paragraph>
          We've also made the website text as simple as possible to understand.
        </Typography>
        
        <Typography variant="body1" paragraph>
          <strong>AbilityNet</strong> has advice on making your device easier to use if you have a disability.
        </Typography>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            How accessible this website is
          </Typography>
          
          <Typography variant="body1" paragraph>
            We know some parts of this website are not fully accessible:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText primary="Some PDF documents are not fully accessible to screen reader software" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Some images do not have alternative text" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Some video content does not have captions or transcripts" />
            </ListItem>
          </List>
        </Box>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            Feedback and contact information
          </Typography>
          
          <Typography variant="body1" paragraph>
            If you find any accessibility issues not listed on this page or if we're not meeting the requirements of the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018, then please let us know.
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Email:</strong> accessibility@wickwaxrelax.co.uk
          </Typography>
          
          <Typography variant="body1" paragraph>
            We'll consider your request and get back to you within 14 days.
          </Typography>
        </Box>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            Enforcement procedure
          </Typography>
          
          <Typography variant="body1" paragraph>
            The Equality and Human Rights Commission (EHRC) is responsible for enforcing the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 (the 'accessibility regulations'). If you're not happy with how we respond to your complaint, contact the Equality Advisory and Support Service (EASS).
          </Typography>
        </Box>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            Technical information about this website's accessibility
          </Typography>
          
          <Typography variant="body1" paragraph>
            Wick Wax & Relax is committed to making its website accessible, in accordance with the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018.
          </Typography>
          
          <Typography variant="body1" paragraph>
            This website is partially compliant with the Web Content Accessibility Guidelines (WCAG) version 2.1 AA standard, due to the non-compliances listed below.
          </Typography>
        </Box>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            Non-accessible content
          </Typography>
          
          <Typography variant="body1" paragraph>
            The content listed below is non-accessible for the following reasons.
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Non-compliance with the accessibility regulations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Some images do not have a text alternative, so people using a screen reader cannot access the information. This fails WCAG 1.1.1 (Non-text Content).
              </Typography>
              
              <Typography variant="body1" paragraph>
                Some video content does not have captions or transcripts, so people using a screen reader cannot access the information. This fails WCAG 1.2.2 (Captions) and WCAG 1.2.4 (Audio Description).
              </Typography>
              
              <Typography variant="body1" paragraph>
                Some PDF documents are not fully accessible to screen reader software. This fails WCAG 1.4.2 (Audio Control).
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Disproportionate burden</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                We believe that fixing some accessibility issues would be a disproportionate burden within the meaning of the accessibility regulations. We will make another assessment when we next update the website.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Content that's not within the scope of the accessibility regulations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                The following content is not within the scope of the accessibility regulations:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText primary="Pre-recorded audio and video published before 23 September 2020" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="PDFs or other documents published before 23 September 2018, unless they're essential to providing our services" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Third-party content that we don't fund or control" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Archived content that's not needed for services we provide" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            What we're doing to improve accessibility
          </Typography>
          
          <Typography variant="body1" paragraph>
            We are committed to improving the accessibility of our website. Here's what we're doing:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Regular Audits
                </Typography>
                <Typography variant="body2">
                  We conduct regular accessibility audits using automated tools and manual testing to identify and fix issues.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Training
                </Typography>
                <Typography variant="body2">
                  Our development team receives regular training on accessibility best practices and WCAG guidelines.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  User Testing
                </Typography>
                <Typography variant="body2">
                  We include people with disabilities in our user testing process to ensure our website is accessible to everyone.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Continuous Improvement
                </Typography>
                <Typography variant="body2">
                  We are continuously working to improve the accessibility of our website and will update this statement as we make progress.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            Preparation of this accessibility statement
          </Typography>
          
          <Typography variant="body1" paragraph>
            This statement was prepared on 1 September 2023. It was last reviewed on 1 September 2023.
          </Typography>
          
          <Typography variant="body1" paragraph>
            This website was last tested on 1 September 2023. The test was carried out by Wick Wax & Relax.
          </Typography>
          
          <Typography variant="body1" paragraph>
            We used this approach to assess the accessibility of this website:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText primary="Automated testing with axe-core and Lighthouse" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Manual testing with keyboard navigation" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Testing with screen readers (VoiceOver, NVDA)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Color contrast testing" />
            </ListItem>
          </List>
        </Box>
      </Container>
    </>
  );
};

export default AccessibilityStatement;