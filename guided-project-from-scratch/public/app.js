// public/app.js
document.addEventListener('DOMContentLoaded', () => {
    const startLessonBtn = document.getElementById('startLesson');
    const startExerciseBtn = document.getElementById('startExercise');
    const submitAnswerBtn = document.getElementById('submitAnswer');
    const restartBtn = document.getElementById('restart');
  
    const languageInput = document.getElementById('language');
    const topicInput = document.getElementById('topic');
  
    const lessonSection = document.getElementById('lessonSection');
    const exerciseSection = document.getElementById('exerciseSection');
    const feedbackSection = document.getElementById('feedbackSection');
  
    const lessonContent = document.getElementById('lessonContent');
    const exerciseContent = document.getElementById('exerciseContent');
    const feedbackContent = document.getElementById('feedbackContent');
    const userAnswer = document.getElementById('userAnswer');
  
    startLessonBtn.addEventListener('click', async () => {
      const language = languageInput.value.trim();
      const topic = topicInput.value.trim();
  
      if (!language || !topic) {
        alert('Please enter both language and topic.');
        return;
      }
  
      const response = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, topic }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        lessonContent.textContent = data.lesson;
        lessonSection.style.display = 'block';
      } else {
        alert(data.error || 'Failed to fetch lesson.');
      }
    });
  
    startExerciseBtn.addEventListener('click', async () => {
      const language = languageInput.value.trim();
      const topic = topicInput.value.trim();
  
      const response = await fetch('/api/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, topic }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        exerciseContent.textContent = data.exercise;
        exerciseSection.style.display = 'block';
      } else {
        alert(data.error || 'Failed to fetch exercise.');
      }
    });
  
    submitAnswerBtn.addEventListener('click', async () => {
      const language = languageInput.value.trim();
      const answer = userAnswer.value.trim();
  
      if (!answer) {
        alert('Please enter your answer.');
        return;
      }
  
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, answer }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        feedbackContent.textContent = data.feedback;
        feedbackSection.style.display = 'block';
      } else {
        alert(data.error || 'Failed to fetch feedback.');
      }
    });
  
    restartBtn.addEventListener('click', () => {
      // Reset all sections
      lessonSection.style.display = 'none';
      exerciseSection.style.display = 'none';
      feedbackSection.style.display = 'none';
      languageInput.value = '';
      topicInput.value = '';
      userAnswer.value = '';
    });
  });
  