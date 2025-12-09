import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { OptimizedImage } from '../ui/OptimizedImage'

interface SectionProps {
    slots: []
}

function BarAdds({ slots }: SectionProps) {
    return (
        <Container>
            <Row>
                {slots.map((slot, i) =>
                    <Col className={slots?.length > 1 ? '':'g-0'} md={slots?.length > 1 ? 6 : 12} key={i}>
                        <OptimizedImage
                            src="https://new.igihe.com/wp-content/uploads/2025/06/caa3f25a5ccb242364ace735995d9556d6af4ae4-2048x289.png"
                            alt="Featured content"
                            fill
                            height={91}
                            className="object-cover"
                        />
                    </Col>
                )}

            </Row>
        </Container>
    )
}

export default BarAdds