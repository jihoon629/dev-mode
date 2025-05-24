import React, { useState, useEffect } from 'react';
import willService from '../services/willService';
import { useNavigate } from 'react-router-dom';

export default function WillList({ onSelect }) {
    const [list, setList] = useState([]);
    const [status, setStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    // 컴포넌트 마운트 시 세션에서 username 가져오기
    useEffect(() => {
        const storedUsername = sessionStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
            console.log("WillList: Loaded username from session:", storedUsername);
        } else {
            setStatus("로그인이 필요합니다. 사용자 이름을 세션에서 찾을 수 없습니다.");
            console.warn("WillList: Username not found in session storage.");
        }
    }, []); // 빈 배열을 전달하여 컴포넌트 마운트 시 한 번만 실행

    const handleFetch = async () => {
        // username 상태를 직접 사용하므로, 파라미터로 받을 필요 없음
        if (!username) {
            setStatus('사용자 이름을 가져올 수 없습니다. 먼저 로그인해주세요.');
            // 이 함수는 username이 설정된 후에만 호출될 것이므로,
            // 이 조건은 추가적인 방어 로직으로 볼 수 있습니다.
            return;
        }
        setStatus('조회 중...');
        try {
            const willsData = await willService.getMyWills(username); // API 응답이 바로 데이터라고 가정 (이전 코드와 일관성)
            console.log("WillList: Response from getMyWills:", willsData);

            if (Array.isArray(willsData) && willsData.length > 0) {
                setList(willsData);
                setStatus(`${willsData.length}개의 유언장이 조회되었습니다.`);
            } else if (Array.isArray(willsData) && willsData.length === 0) {
                setStatus('작성한 유언장이 없습니다.');
                setList([]);
            } else {
                console.error("WillList: Unexpected response structure from getMyWills:", willsData);
                setStatus('유언장 정보를 가져오는 데 실패했습니다. 응답 형식을 확인해주세요.');
                setList([]);
            }
        } catch (err) {
            console.error('WillList: Error fetching wills:', err);
            // err.data는 axios 에러 응답의 일부일 수 있음 (err.response.data)
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || '알 수 없는 오류';
            setStatus('조회 실패: ' + errorMessage);
            setList([]);
        }
    };
    
    // username 상태가 설정되면 자동으로 유언장 목록 조회
    useEffect(() => {
        if (username) { // username이 세션에서 성공적으로 로드되었을 때만 실행
            handleFetch();
        }
        // username이 비어있으면 (초기 상태 또는 세션에 없을 때) handleFetch를 호출하지 않음
    }, [username]); // username이 변경될 때마다 이 useEffect 실행

    const filteredList = list.filter(item => {
        const id = item.willID || item.Key || '';
        const title = item.title || '';
        const keyword = searchTerm.toLowerCase();
        return (
            id.toLowerCase().includes(keyword) ||
            title.toLowerCase().includes(keyword)
        );
    });

    const handleItemClick = (willId) => {
        if (willId) {
            if (onSelect) {
                onSelect(willId);
            } else {
                navigate(`/detail/${willId}`);
            }
        }
    };

    return (
        <div className="form-group">
            <h3>나의 유언장 목록 조회</h3>
            {username ? (
                <>
                    {/* "조회하기" 버튼 제거 */}
                    {/* <button className="btn btn-info mb-2" onClick={handleFetch}>조회하기</button> */}
                    <input
                        className="form-control mb-2"
                        placeholder="검색어를 입력하세요 (ID 또는 제목)"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </>
            ) : (
                // username이 없으면 로그인하라는 메시지는 status에 이미 표시될 수 있음
                // 여기서는 status 메시지에 의존하거나, 별도의 메시지를 유지할 수 있음
                // <p>유언장을 조회하려면 먼저 로그인해주세요.</p> // 이 메시지는 setStatus로 관리되므로 중복될 수 있음
                null // 또는 status 메시지가 이미 "로그인이 필요합니다..." 등을 표시하므로 여기선 아무것도 표시 안 함
            )}
            <p>{status}</p> {/* 상태 메시지 (예: "조회 중...", "X개의 유언장이 조회되었습니다.", "로그인이 필요합니다.") */}
            {list.length > 0 && (
                 <ul className="list-group">
                 {filteredList.map((item, idx) => (
                     <li
                         key={item.willID || item.Key || idx}
                         className="list-group-item list-group-item-action"
                         style={{ cursor: 'pointer' }}
                         onClick={() => handleItemClick(item.willID || item.Key)}
                     >
                         <strong>ID:</strong> {item.willID || item.Key}<br />
                         <strong>제목:</strong> {item.title || '제목 없음'}
                     </li>
                 ))}
             </ul>
            )}
        </div>
    );
}