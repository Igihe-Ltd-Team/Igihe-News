import { Author, Byline } from '@/types/fetchData'
import { OptimizedImage } from '../ui/OptimizedImage'
import { ThemedText } from '../ThemedText'

interface AuthorBioProps {
    author: Byline
}

export default function AuthorBio({ author }: AuthorBioProps) {
    return (
        <div className="row mb-5">
            <div className="col-12 p-0">
                <div className="card border-0 bg-light">
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-2 text-center mb-3 mb-md-0">
                                {author.image && (
                                    <OptimizedImage
                                        src={author.image}
                                        alt={author.name || ''}
                                        width={100}
                                        height={150}
                                        className="rounded-circle img-thumbnail"
                                        imgClass='object-fit-cover'
                                    />
                                )}
                            </div>
                            <div className="col-md-9">
                                <div>
                                <ThemedText type='subtitle'>
                                    {author.name}
                                </ThemedText>
                                </div>
                                {author.description && (
                                    <ThemedText type='small'>
                                        {author.description}
                                    </ThemedText>
                                )}
                                
                                {/* <div className="d-flex flex-wrap gap-3 text-muted">
                                    <div className="d-flex align-items-center gap-1">
                                        <i className="bi bi-file-text"></i>
                                        <span>
                                            <strong>{author.post_count || 0}</strong> articles
                                        </span>
                                    </div>
                                    
                                    {author.registered_date && (
                                        <div className="d-flex align-items-center gap-1">
                                            <i className="bi bi-calendar"></i>
                                            <span>
                                                Member since {new Date(author.registered_date).getFullYear()}
                                            </span>
                                        </div>
                                    )}
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}