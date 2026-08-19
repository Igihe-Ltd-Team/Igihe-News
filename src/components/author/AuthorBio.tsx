// import { Author, Byline } from '@/types/fetchData'
// import { OptimizedImage } from '../ui/OptimizedImage'
// import { ThemedText } from '../ThemedText'

// interface AuthorBioProps {
//     author: Byline
// }

// export default function AuthorBio({ author }: AuthorBioProps) {
//     return (
//         <div className="row mb-5">
//             <div className="col-12 p-0">
//                 <div className="card border-0 bg-light">
//                     <div className="card-body p-4">
//                         <div className="row align-items-center">
//                             <div className="col-md-2 text-center mb-3 mb-md-0">
//                                 {author.image && (
//                                     <OptimizedImage
//                                         src={author.image}
//                                         alt={author.name || ''}
//                                         width={100}
//                                         height={150}
//                                         className="rounded-circle img-thumbnail"
//                                         imgClass='object-fit-cover'
//                                     />
//                                 )}
//                             </div>
//                             <div className="col-md-9">
//                                 <div>
//                                 <ThemedText type='subtitle'>
//                                     {author.name}
//                                 </ThemedText>
//                                 </div>
//                                 {author.description && (
//                                     <ThemedText type='small'>
//                                         {author.description}
//                                     </ThemedText>
//                                 )}
                                
//                                 {/* <div className="d-flex flex-wrap gap-3 text-muted">
//                                     <div className="d-flex align-items-center gap-1">
//                                         <i className="bi bi-file-text"></i>
//                                         <span>
//                                             <strong>{author.post_count || 0}</strong> articles
//                                         </span>
//                                     </div>
                                    
//                                     {author.registered_date && (
//                                         <div className="d-flex align-items-center gap-1">
//                                             <i className="bi bi-calendar"></i>
//                                             <span>
//                                                 Member since {new Date(author.registered_date).getFullYear()}
//                                             </span>
//                                         </div>
//                                     )}
//                                 </div> */}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }


import { Byline } from "@/types/fetchData";
import { OptimizedImage } from "../ui/OptimizedImage";
import { ThemedText } from "../ThemedText";

interface AuthorBioProps {
  author: Byline;
}

export default function AuthorBio({ author }: AuthorBioProps) {

    console.log("author",JSON.stringify(author))
  return (
    <section className="author-bio-section">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="author-image-wrapper">
            {author.image ? (
              <OptimizedImage
                src={author.image}
                alt={author.name || ""}
                height={100}
                className="author-image"
                imgClass="object-fit-cover object-position-left"
              />
            ) : (
              <OptimizedImage
                src="/assets/images.png"
                alt="Default Author"
                height={100}
                className="author-image"
                imgClass="object-fit-cover object-position-left"
              />
            )}
          </div>

          {/* Left Content */}
          <div className="col-lg-10 author-content">
            <div className="row">
              <div className="col-md-10">
                <ThemedText
                  type="subtitle"
                  darkColor="#fff"
                  lightColor="#282F2F"
                >
                  {author.name}
                </ThemedText>
                {/* 
                        {author?.role && (
                            <p className="author-role">
                                {author?.role}
                            </p>
                        )} */}

                {/* <div className="author-divider"></div> */}

                {author.description && (
                  <ThemedText
                    darkColor="#fff"
                    lightColor="#282F2F"
                    className="author-description"
                  >
                    {author.description}
                  </ThemedText>
                )}

                <p className="author-description">
                  <ThemedText
                    type="default"
                    darkColor="#fff"
                    lightColor="#282F2F"
                  >
                    
                  </ThemedText>
                </p>

                {/* <button className="author-button">
                            Read Full Bio
                        </button> */}
              </div>
              <div className="col-md-2 d-flex align-items-center">
                <a
                  target="_blank"
                  href="https://x.com/igihe"
                  className="social-card"
                >
                  <i className="bi bi-twitter-x twitter social-icon"></i>
                  <span className="social-name">X (Twitter)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Image */}
        </div>
      </div>
    </section>
  );
}
