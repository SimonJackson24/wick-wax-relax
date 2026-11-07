import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  Chip,
  useTheme,
} from '@mui/material';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Product Q&A — Amazon's "Customer questions & answers" in brand skin.
// Anyone reads; logged-in shoppers ask; staff answers (badged).
const ProductQa = ({ productId }) => {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`/api/products/${productId}/questions`);
      setQuestions(res.data.questions || []);
    } catch { /* section silently empty */ }
    setLoaded(true);
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const submitQuestion = async () => {
    if (draft.trim().length < 5) return;
    setSubmitting(true);
    setNotice('');
    try {
      const res = await axios.post(`/api/products/${productId}/questions`, { question: draft.trim() });
      setQuestions((prev) => [res.data, ...prev]);
      setDraft('');
      setAskOpen(false);
      setNotice('Thanks — your question is posted. We usually answer within a day.');
    } catch (e) {
      setNotice(e.response?.status === 401
        ? 'Please log in to ask a question.'
        : 'Could not post your question — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
          Questions & Answers
        </Typography>
        {isAuthenticated ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContactSupportIcon />}
            onClick={() => setAskOpen((v) => !v)}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Ask a question
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Log in to ask a question
          </Typography>
        )}
      </Box>

      {askOpen && (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="e.g. How long does the scent last in a medium room?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
          <Button
            variant="contained"
            size="small"
            disabled={submitting || draft.trim().length < 5}
            onClick={submitQuestion}
            sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? 'Posting…' : 'Post question'}
          </Button>
        </Box>
      )}

      {notice && (
        <Typography variant="body2" sx={{ mt: 1, color: theme.palette.success.dark }}>
          {notice}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {loaded && questions.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No questions yet — be the first to ask.
        </Typography>
      )}

      {questions.map((q) => (
        <Box key={q.id} sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Q: {q.question}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: q.answers.length ? 1 : 0 }}>
            asked by {q.authorName}
          </Typography>
          {q.answers.map((a) => (
            <Box
              key={a.id}
              sx={{
                pl: 2,
                borderLeft: `3px solid ${theme.palette.primary.light}`,
                mt: 1,
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                {a.answer}
              </Typography>
              {a.isStaff && (
                <Chip
                  size="small"
                  label="Wick Wax & Relax"
                  sx={{
                    mt: 0.5,
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: 'rgba(156, 39, 176, 0.08)',
                    color: theme.palette.primary.dark,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          ))}
          {q.answers.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ pl: 2, borderLeft: `3px solid ${theme.palette.divider}`, mt: 1 }}>
              Awaiting an answer from our team
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ProductQa;
