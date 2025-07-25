import  { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Help.css';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [popularTopics, setPopularTopics] = useState([]);
  const categoryRefs = useRef({});
  const helpData = {
    categories: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        icon: '🚀',
        articles: [
          {
            id: 'join-class',
            question: 'How to join a class',
            answer: `To join a class in Classroom:
            1. Sign in to your Classroom account
            2. Click the '+' icon in the top right corner
            3. Select 'Join class'
            4. Enter the class code provided by your teacher
            5. Click 'Join'
            
            Note: Class codes are typically 6-7 characters long and may contain letters and numbers. If you're having trouble joining, check with your teacher to ensure the code is correct.`,
            tags: ['student', 'basics']
          },
          {
            id: 'submit-assignment',
            question: 'How to submit assignments',
            answer: `Submitting assignments:
            1. Go to the Classwork page for your class
            2. Click on the assignment you need to submit
            3. Review the instructions and any attached materials
            4. Click 'Add or create' to attach your work
            5. Select files from your device or create new documents
            6. Add any private comments for your teacher
            7. Click 'Turn in' to submit
            
            Important: You can only turn in an assignment once. After turning in, you'll need to ask your teacher to return it if you need to make changes.`,
            tags: ['student', 'assignments']
          },
          {
            id: 'view-grades',
            question: 'How to view your grades',
            answer: `Viewing your grades:
            1. Go to the class where you want to see grades
            2. Click on 'Grades' in the top navigation
            3. You'll see a list of all assignments and your grades
            4. Click on any assignment to see detailed feedback
            
            Note: Some teachers might not post all grades immediately. If you don't see a grade for an assignment, check back later or ask your teacher.`,
            tags: ['student', 'grades']
          },
          {
            id: 'navigate-platform',
            question: 'Navigating the platform',
            answer: `Classroom Navigation Guide:
            - Stream: Shows recent announcements and activity
            - Classwork: Contains all assignments and materials
            - People: Lists teachers and classmates
            - Grades: Shows your progress (student view) or grading tools (teacher view)
            
            Use the sidebar to switch between classes. The calendar icon shows upcoming due dates.`,
            tags: ['student', 'teacher', 'navigation']
          }
        ]
      },
      {
        id: 'for-teachers',
        title: 'For Teachers',
        icon: '👩‍🏫',
        articles: [
          {
            id: 'create-class',
            question: 'How to create a class',
            answer: `Creating a new class:
            1. Click the '+' icon in the top right corner
            2. Select 'Create class'
            3. Enter the class name (required)
            4. Add section, subject, and room (optional)
            5. Click 'Create'
            
            After creation, you can:
            - Customize the theme and header image
            - Invite co-teachers
            - Generate a class code for students to join`,
            tags: ['teacher', 'setup']
          },
          {
            id: 'post-assignment',
            question: 'How to post assignments',
            answer: `Posting assignments:
            1. Go to the Classwork tab in your class
            2. Click '+ Create' and select 'Assignment'
            3. Enter a title and instructions
            4. Set due date and topic (optional)
            5. Attach files or links if needed
            6. Choose posting options:
               - Save draft
               - Assign immediately
               - Schedule for later
            7. Select classes or individual students
            8. Click 'Assign' or 'Schedule'
            
            Tip: Use topics to organize assignments by unit or week.`,
            tags: ['teacher', 'assignments']
          },
          {
            id: 'grade-work',
            question: 'How to grade work',
            answer: `Grading student work:
            1. Go to the Classwork tab
            2. Click on the assignment you want to grade
            3. Click 'View assignment'
            4. You'll see a list of student submissions
            5. Click on a student's name to review their work
            6. Add comments or annotations directly on documents
            7. Enter a grade (points or letter grade)
            8. Click 'Return' to send back to student with feedback
            
            Advanced features:
            - Rubrics for consistent grading
            - Reuse comments for common feedback
            - Bulk return multiple assignments`,
            tags: ['teacher', 'grading']
          },
          {
            id: 'manage-class',
            question: 'Class management tips',
            answer: `Effective class management:
            - Use topics to organize classwork
            - Schedule announcements for optimal times
            - Set up email notifications for important activity
            - Archive old classes to keep your list clean
            - Use the 'Move to top' feature for important posts
            - Create question-type assignments for quick checks
            - Utilize the 'Originality reports' for plagiarism checks
            
            Pro tip: Create a 'Resources' topic at the top with frequently needed materials.`,
            tags: ['teacher', 'management']
          }
        ]
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        icon: '🔧',
        articles: [
          {
            id: 'cant-join',
            question: 'Can\'t join a class',
            answer: `If you can't join a class:
            
            Common issues and solutions:
            1. Invalid class code
               - Double-check the code with your teacher
               - Codes are case-sensitive
            
            2. Class is full
               - Contact the teacher - they may need to increase the limit
            
            3. Already in the class
               - Check your class list - you might already be enrolled
            
            4. Account restrictions
               - School accounts may have joining limitations
               - Verify you're signed in with the correct account
            
            If problems persist:
            - Try joining from a different device
            - Clear browser cache and cookies
            - Try a different browser`,
            tags: ['student', 'joining']
          },
          {
            id: 'submission-issues',
            question: 'Assignment submission issues',
            answer: `Submission problems and fixes:
            
            1. "Turn in" button grayed out
               - Ensure you've attached required files
               - Check if the due date has passed
            
            2. File upload errors
               - Check file size limits (typically 100MB)
               - Try a different file format
            
            3. Lost work
               - Check your Drive for autosaved drafts
               - Contact teacher if submission was interrupted
            
            4. Late submissions
               - Some teachers allow late turn-ins
               - Check assignment details for policies
            
            Always:
            - Keep backup copies of important work
            - Submit well before deadlines
            - Confirm submission with a screenshot if needed`,
            tags: ['student', 'assignments']
          },
          {
            id: 'tech-requirements',
            question: 'Technical requirements',
            answer: `System requirements for Classroom:
            
            Minimum:
            - Latest version of Chrome, Firefox, Edge, or Safari
            - JavaScript and cookies enabled
            - 2GB RAM
            - 5Mbps internet connection
            
            Recommended:
            - Chrome browser for best performance
            - 4GB+ RAM for multiple tabs
            - 10Mbps+ connection for video content
            
            Mobile apps:
            - Android 6.0+ or iOS 14+
            - Latest Classroom app version
            
            Supported file types:
            - Documents: PDF, DOCX, PPTX, XLSX
            - Images: JPG, PNG, GIF
            - Videos: MP4, MOV (up to 1GB)`,
            tags: ['all', 'technical']
          },
          {
            id: 'login-problems',
            question: 'Login and account issues',
            answer: `Troubleshooting account problems:
            
            1. Can't sign in
               - Reset password if forgotten
               - Check if account is locked (contact admin)
               - Verify correct domain for school accounts
            
            2. Wrong account type
               - Personal and school accounts are separate
               - Sign out and use correct login
            
            3. "Account disabled" message
               - School admins can disable accounts
               - Contact your IT department
            
            4. Two-factor authentication
               - Have backup codes ready
               - Use trusted devices when possible
            
            For school-managed accounts:
            - Contact your school's IT support
            - Don't create personal accounts with school emails`,
            tags: ['all', 'accounts']
          }
        ]
      },
      {
        id: 'advanced-features',
        title: 'Advanced Features',
        icon: '💎',
        articles: [
          {
            id: 'rubrics',
            question: 'Using grading rubrics',
            answer: `Creating and using rubrics:
            
            1. When creating an assignment, click 'Rubric'
            2. Choose to create new or reuse existing
            3. Define criteria and performance levels
            4. Set point values for each level
            5. Save and attach to assignment
            
            Grading with rubrics:
            - Click performance level to assign points
            - Students see rubric before submitting
            - Consistent evaluation across submissions
            
            Tips:
            - Create template rubrics for common assignments
            - Share rubrics with co-teachers
            - Use decimal points for finer grading`,
            tags: ['teacher', 'grading']
          },
          {
            id: 'originality-reports',
            question: 'Originality reports',
            answer: `About originality reports:
            - Checks student work for plagiarism
            - Compares against web pages and books
            - Available for eligible assignments
            
            Enabling:
            1. When creating assignment, check 'Enable originality reports'
            2. Students will see reports after submission
            
            Interpreting results:
            - Percentage shows matched text
            - Click matches to see sources
            - Consider context when evaluating
            
            Note:
            - Some institutions limit access
            - Only works with Google Docs files
            - Teachers can run reports after submission`,
            tags: ['teacher', 'assignments']
          },
          {
            id: 'parent-summaries',
            question: 'Parent summaries',
            answer: `Parent notification emails:
            - Weekly summaries of student work
            - Includes missing and upcoming assignments
            - Grades may be included based on settings
            
            Setup:
            1. Teachers invite parents via email
            2. Parents accept invitation
            3. Summaries sent automatically
            
            Parent controls:
            - Choose daily or weekly frequency
            - Unsubscribe at any time
            - View summaries online
            
            Note:
            - Parents can't access Classroom directly
            - Only see information about their child
            - Teachers control what's shared`,
            tags: ['teacher', 'parents']
          }
        ]
      }
    ],
    popular: [
      'join-class',
      'submit-assignment',
      'create-class',
      'cant-join',
      'tech-requirements'
    ]
  };

  useEffect(() => {
    // Set popular topics on component mount
    setPopularTopics(helpData.popular.map(id => {
      for (const category of helpData.categories) {
        const article = category.articles.find(a => a.id === id);
        if (article) return { ...article, category: category.id };
      }
      return null;
    }).filter(Boolean));
  }, []);

  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactForm);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const filteredArticles = helpData.categories
    .filter(category => activeCategory === 'all' || category.id === activeCategory)
    .flatMap(category => 
      category.articles.filter(article => 
        article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ));

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId !== 'all' && categoryRefs.current[categoryId]) {
      setTimeout(() => {
        categoryRefs.current[categoryId].scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 0);
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="help-container">
      <div className="help-header">
        <Link to="/home" className="back-to-home">
          &larr; Back to Home
        </Link>
        <h1>Learning Management System Help Center</h1>
        <p>Find answers, guides, and tutorials for using Classroom effectively</p>
      </div>
      
      <div className="help-search">
        <input 
          type="text" 
          placeholder="Search help topics (e.g., 'assignments', 'grades')..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button>
          <span className="material-symbols-outlined"></span>
          Search
        </button>
      </div>
      
      <div className="help-categories">
        <button 
          className={`category-filter ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleCategoryClick('all')}
        >
          <span className="category-icon">📚</span>
          All Topics
        </button>
        {helpData.categories.map(category => (
          <button
            key={category.id}
            className={`category-filter ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            {category.title}
          </button>
        ))}
      </div>
      
      {searchQuery ? (
        <div className="search-results">
          <h2>Search Results for "{searchQuery}"</h2>
          {filteredArticles.length > 0 ? (
            <div className="results-list">
              {filteredArticles.map(article => (
                <div key={article.id} className="search-result-item">
                  <h3>{article.question}</h3>
                  <p className="result-preview">
                    {article.answer.substring(0, 150)}...
                  </p>
                  <button 
                    className="view-result"
                    onClick={() => {
                      setActiveCategory(helpData.categories.find(c => 
                        c.articles.some(a => a.id === article.id)).id);
                      toggleItem(article.id);
                      window.scrollTo({
                        top: document.getElementById(article.id).offsetTop - 100,
                        behavior: 'smooth'
                      });
                    }}
                  >
                    View full answer
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No results found for "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')}>Clear search</button>
            </div>
          )}
        </div>
      ) : (
        <>
          {popularTopics.length > 0 && (
            <div className="popular-topics">
              <h2>Popular Help Topics</h2>
              <div className="popular-grid">
                {popularTopics.map(topic => (
                  <div 
                    key={topic.id} 
                    className="popular-card"
                    onClick={() => {
                      setActiveCategory(topic.category);
                      toggleItem(topic.id);
                      window.scrollTo({
                        top: document.getElementById(topic.id).offsetTop - 100,
                        behavior: 'smooth'
                      });
                    }}
                  >
                    <h3>{topic.question}</h3>
                    <p>{topic.answer.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="help-sections">
            {helpData.categories
              .filter(category => activeCategory === 'all' || category.id === activeCategory)
              .map(category => (
                <div 
                  key={category.id} 
                  className="help-category-section"
                  ref={el => categoryRefs.current[category.id] = el}
                >
                  <h2 className="category-title">
                    <span className="category-icon">{category.icon}</span>
                    {category.title}
                  </h2>
                  <div className="category-articles">
                    {category.articles
                      .filter(article => 
                        article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        article.answer.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(article => (
                        <div 
                          key={article.id} 
                          id={article.id}
                          className={`help-article ${expandedItems[article.id] ? 'expanded' : ''}`}
                        >
                          <div 
                            className="article-question"
                            onClick={() => toggleItem(article.id)}
                          >
                            <h3>{article.question}</h3>
                            <span className="expand-icon">
                              {expandedItems[article.id] ? '−' : '+'}
                            </span>
                          </div>
                          {expandedItems[article.id] && (
                            <div className="article-answer">
                              <div className="answer-content" dangerouslySetInnerHTML={{
                                __html: article.answer.replace(/\n/g, '<br />')
                              }} />
                              <div className="article-tags">
                                {article.tags.map(tag => (
                                  <span key={tag} className="tag">{tag}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Help;