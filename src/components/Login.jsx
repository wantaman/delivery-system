import axios from "axios";
import { useEffect, useState } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('login'));
        if (saved) {
            setEmail(saved.email);
            setPassword(saved.password);
            setRemember(true);
        }
    }, []);

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            if (remember) localStorage.setItem('login', JSON.stringify({ email, password }));
            else localStorage.removeItem('login');

            const credentials = btoa(`${email}:${password}`);
            const response = await axios.post(
                // 'http://localhost:9001/api/auth/login',
                'https://96.9.77.143:7001/loar-tinh/api/auth/login',
                { email, password }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }, timeout: 5000
            });

            const user = response.data.data.user;
            const accessToken = response.data.data.accessToken;

            onLogin(accessToken, user.id);
        } catch (err) {
            console.log('Login failed. Please check your credentials.');
        }
    };

    return (
        <Container fluid className="mt-5 px-2">
            <Row className="justify-content-center">
                <Col xs={12} sm={10} md={8} lg={6} xl={4}>
                    <h2 className="mb-4 text-center">Login</h2>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formEmail" className="mb-3">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="formPassword" className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="formRemember" className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Remember password"
                                checked={remember}
                                onChange={e => setRemember(e.target.checked)}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 py-2">
                            Sign In
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}