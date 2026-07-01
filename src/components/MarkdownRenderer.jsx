import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import './MarkdownRenderer.css';

/**
 * Markdown渲染组件
 * 支持GitHub风格的markdown语法和代码高亮
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义代码块渲染
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="code-block-wrapper">
                <div className="code-block-header">
                  <span className="code-language">{match[1]}</span>
                  <button
                    className="copy-code-btn"
                    onClick={async (e) => {
                      try {
                        await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                        // 可以添加一个临时的成功提示
                        const btn = e.target;
                        const originalText = btn.textContent;
                        btn.textContent = '✅';
                        setTimeout(() => {
                          btn.textContent = originalText;
                        }, 2000);
                      } catch (err) {
                        console.error('复制失败:', err);
                        // 降级方案：选择文本
                        const range = document.createRange();
                        range.selectNodeContents(e.target.closest('.code-block-wrapper').querySelector('code'));
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                      }
                    }}
                    title="复制代码"
                  >
                    📋
                  </button>
                </div>
                <pre className={className} {...props}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className={`inline-code ${className}`} {...props}>
                {children}
              </code>
            );
          },
          // 自定义表格渲染
          table({ children }) {
            return (
              <div className="table-wrapper">
                <table>{children}</table>
              </div>
            );
          },
          // 自定义链接渲染
          a({ href, children }) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="markdown-link"
              >
                {children}
              </a>
            );
          },
          // 自定义引用块渲染
          blockquote({ children }) {
            return (
              <blockquote className="markdown-blockquote">
                {children}
              </blockquote>
            );
          },
          // 自定义列表渲染
          ul({ children }) {
            return <ul className="markdown-list">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="markdown-list">{children}</ol>;
          },
          // 自定义标题渲染
          h1({ children }) {
            return <h1 className="markdown-heading markdown-h1">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="markdown-heading markdown-h2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="markdown-heading markdown-h3">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="markdown-heading markdown-h4">{children}</h4>;
          },
          h5({ children }) {
            return <h5 className="markdown-heading markdown-h5">{children}</h5>;
          },
          h6({ children }) {
            return <h6 className="markdown-heading markdown-h6">{children}</h6>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
